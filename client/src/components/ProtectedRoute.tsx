import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useDevAccess } from '@/hooks/useDevAccess';
import { isLeoMartins } from '@shared/conselho';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  routeName: string;
}

// Mapeamento de papéis para suas rotas permitidas - RBAC System
const ROLE_TO_ALLOWED_ROUTES: Record<string, string[]> = {
  'super_admin': ['/', '/plans', '/administrador', '/leo-martins', '/central-ajuda'],
  'leo': ['/', '/plans', '/administrador', '/leo-martins', '/central-ajuda', '/tdoador', '/welcome', '/busca', '/noticias', '/perfil', '/dados-cadastrais', '/pagamentos', '/configuracoes', '/sobre', '/change-plan', '/beneficios', '/meus-lances', '/missoes-semanais'],
  'desenvolvedor': ['/', '/plans', '/dev', '/central-ajuda', '/perfil', '/dados-cadastrais', '/sobre', '/configuracoes'], // Dev tem acesso universal via hook
  'admin': ['/', '/plans', '/admin-geral', '/central-ajuda', '/professor', '/monitor', '/coordenador', '/coordenador/inclusao-produtiva', '/coordenador/esporte-cultura', '/coordenador/psicossocial', '/pec', '/patrocinador-dashboard', '/perfil-patrocinador'],
  
  // ================ NOVOS PAPÉIS RBAC ================
  'professor': ['/', '/plans', '/professor', '/central-ajuda'],
  'monitor': ['/', '/plans', '/monitor', '/central-ajuda'],
  'coordenador_inclusao': ['/', '/plans', '/coordenador', '/coordenador/inclusao-produtiva', '/central-ajuda'],
  'coordenador_pec': ['/', '/plans', '/coordenador', '/coordenador/esporte-cultura', '/central-ajuda'],
  'coordenador_psico': ['/', '/plans', '/coordenador', '/coordenador/psicossocial', '/central-ajuda'],
  
  // ================ PAPÉIS EXISTENTES ================
  'lider': ['/', '/plans', '/educacao', '/professor', '/central-ajuda'],
  'professor_lider': ['/', '/plans', '/educacao', '/professor', '/central-ajuda'],
  'aluno': ['/', '/plans', '/aluno', '/central-ajuda'],
  'doador': ['/', '/plans', '/tdoador', '/welcome', '/busca', '/noticias', '/perfil', '/dados-cadastrais', '/pagamentos', '/configuracoes', '/sobre', '/change-plan', '/central-ajuda'],
  'user': ['/', '/plans', '/tdoador', '/welcome', '/busca', '/noticias', '/perfil', '/dados-cadastrais', '/pagamentos', '/configuracoes', '/sobre', '/change-plan', '/central-ajuda'],
  'conselho': ['/', '/plans', '/conselho', '/central-ajuda', '/perfil', '/dados-cadastrais', '/sobre', '/configuracoes'],
  'conselheiro': ['/', '/plans', '/conselho', '/central-ajuda', '/perfil', '/dados-cadastrais', '/sobre', '/configuracoes'],
  'patrocinador': ['/', '/plans', '/patrocinador-dashboard', '/central-ajuda'],
  'responsavel': ['/', '/plans', '/responsavel', '/central-ajuda'],
  'colaborador': ['/', '/plans', '/colaborador', '/central-ajuda'],
  
};

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = [
  '/', '/plans', '/register', '/entrar', '/verify', '/checkout', '/success', 
  '/pos-pagamento', '/aguardando-aprovacao', '/not-found', '/dev', '/perfil',
  '/typeform-donation', '/donation-flow', '/stripe-payment', '/noticias',
  '/termos-servicos', '/politica-privacidade',   '/pagamento/ingresso',
  '/pagamento/sucesso'
];

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles, 
  routeName 
}) => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const devAccess = useDevAccess();

  useEffect(() => {
    // ⭐ PRIORIDADE 1: Verificar parâmetros dev PRIMEIRO (antes de qualquer validação)
    const urlParams = new URLSearchParams(window.location.search);
    const isDevAccess = urlParams.get('dev_access') === 'true';
    const isFromDevPanel = urlParams.get('origin') === 'dev_panel';
    const devSession = sessionStorage.getItem('dev_session') === 'active';
    
    // ⭐ VERIFICAR TAMBÉM localStorage (compartilhado entre abas)
    const devPanelActive = localStorage.getItem('dev_panel_active') === 'true';
    const devPanelTimestamp = localStorage.getItem('dev_panel_timestamp');
    const isRecentDevPanel = devPanelTimestamp && (Date.now() - parseInt(devPanelTimestamp)) < 60000; // 1 minuto
    
    // Se tem parâmetros dev válidos, permitir acesso imediato (bypass total)
    if ((isDevAccess && isFromDevPanel) || devSession || (devPanelActive && isRecentDevPanel)) {
      console.log('✅ [DEV PANEL ACCESS] Acesso via painel dev - bypass total de autenticação');
      return;
    }
    
    const userPapel = localStorage.getItem('userPapel');
    
    // DEBUG: Log detalhado para investigação
    console.log(`🔍 [PROTECTED ROUTE DEBUG] Tentando acessar: ${routeName}`);
    console.log(`🔍 [USER SESSION] userPapel: ${userPapel}`);
    console.log(`🔍 [USER SESSION] userEmail: ${localStorage.getItem('userEmail')}`);
    console.log(`🔍 [USER SESSION] isVerified: ${localStorage.getItem('isVerified')}`);
    console.log(`🔍 [USER SESSION] hasActiveSubscription: ${localStorage.getItem('hasActiveSubscription')}`);
    console.log(`🔍 [ALLOWED ROLES] Route expects: ${allowedRoles.join(', ')}`);
    console.log(`🔍 [ROLE ROUTES] User role allows: ${userPapel ? ROLE_TO_ALLOWED_ROUTES[userPapel]?.join(', ') : 'undefined'}`);
    
    if (routeName === '/tdoador') {
      console.log(`🎯 [DOADOR ACCESS] Tentativa de acesso à área do doador detectada!`);
      const userEmail = localStorage.getItem('userEmail');
      console.log(`🎯 [EMAIL CHECK] userEmail: ${userEmail}`);
      if (userEmail) {
        console.log(`🎯 [LEO CHECK] isLeoMartins(${userEmail}): ${isLeoMartins(userEmail)}`);
      }
    }
    
    // Desenvolvedores têm acesso universal
    if (devAccess.isDeveloper || 
        devAccess.isGlobalDevMode || 
        userPapel === 'desenvolvedor' ||
        userPapel === 'dev' ||
        window.location.pathname === '/dev') {
      console.log('✅ [DEV ACCESS] Acesso dev concedido - bypass de autenticação');
      return;
    }

    // Verificar se é rota pública
    if (PUBLIC_ROUTES.includes(routeName)) {
      return;
    }

    // ⭐ VERIFICAÇÃO ESPECIAL PARA LEO - ANTES DE TUDO
    const userEmail = localStorage.getItem('userEmail');
    const userTelefone = localStorage.getItem('userTelefone');
    
    if (routeName === '/tdoador') {
      // Normalizar telefone para comparação
      const normalizePhone = (phone: string) => phone?.replace(/\D/g, '').slice(-11);
      const leoPhone = '31986631203';
      
      console.log(`🎯 [LEO EARLY CHECK] Email: ${userEmail}, Telefone: ${userTelefone}`);
      console.log(`🎯 [LEO EARLY CHECK] isLeoMartins(email): ${userEmail ? isLeoMartins(userEmail) : 'false'}`);
      console.log(`🎯 [LEO EARLY CHECK] Phone normalized: ${normalizePhone(userTelefone || '')} === ${leoPhone}`);
      
      // Remoção da lógica automática de criação de sessão para Leo
      // Usuários devem passar pelo fluxo normal de autenticação
    }

    // Obter verificação do usuário
    const isVerified = localStorage.getItem('isVerified') === 'true';
    
    // Usuário DEV tem acesso universal mesmo logado
    if (userPapel === 'desenvolvedor' || userPapel === 'dev') {
      console.log('✅ [DEV ACCESS] Acesso dev concedido via userPapel');
      return;
    }

    // Verificar se usuário está logado - APÓS verificação especial do Leo
    if (!userPapel || !isVerified) {
      console.log(`🚨 [AUTH DEBUG] Redirecionando para login - userPapel: ${userPapel}, isVerified: ${isVerified}`);
      toast({
        title: "Acesso negado",
        description: "Você precisa fazer login para acessar esta área.",
        variant: "destructive",
      });
      setLocation('/entrar');
      return;
    }


    // ⚠️ VERIFICAÇÃO DE PAGAMENTO DESABILITADA TEMPORARIAMENTE PARA EVITAR LOOP
    // A verificação de pagamento deve ser feita no backend quando necessário
    const hasActiveSubscription = localStorage.getItem('hasActiveSubscription') === 'true';
    const isRBACUser = ['professor', 'monitor', 'coordenador_inclusao', 'coordenador_pec', 'coordenador_psico', 'conselho', 'conselheiro', 'lider', 'professor_lider', 'aluno', 'admin', 'super_admin', 'desenvolvedor'].includes(userPapel);
    
    console.log(`🚨 [PAYMENT DEBUG] routeName: ${routeName}, hasActiveSubscription: ${hasActiveSubscription}, userPapel: ${userPapel}, isRBACUser: ${isRBACUser}`);
    console.log(`✅ [ACCESS] Permitindo acesso para usuário verificado - verificação de pagamento no backend se necessário`);

    // ESPECIAL: Verificar se é Leo Martins tentando acessar sua área administrativa  
    if (userEmail && isLeoMartins(userEmail) && routeName === '/leo-martins') {
      return; // Leo sempre tem acesso à sua área administrativa
    }

    // Verificar se o papel do usuário tem permissão para esta rota
    const userAllowedRoutes = ROLE_TO_ALLOWED_ROUTES[userPapel] || [];
    const hasPermission = allowedRoles.includes(userPapel) || userAllowedRoutes.includes(routeName);

    if (!hasPermission) {
      toast({
        title: "Acesso restrito",
        description: `Esta área é restrita. Você será redirecionado para sua página inicial.`,
        variant: "destructive",
      });

      // Redirecionar para a página apropriada baseada no papel
      const redirectTo = getDefaultRouteForRole(userPapel);
      setLocation(redirectTo);
      return;
    }
  }, [allowedRoles, routeName, devAccess.isDeveloper, devAccess.isGlobalDevMode, setLocation, toast]);

  return <>{children}</>;
};

// Função para obter telas permitidas para cada tipo de usuário - RBAC System
function getPermittedScreensForRole(userPapel: string): string[] {
  switch (userPapel) {
    // ================ NOVOS PAPÉIS RBAC ================
    case 'professor':
      return ['/professor', '/central-ajuda'];
    
    case 'monitor':
      return ['/monitor', '/central-ajuda'];
    
    case 'coordenador_inclusao':
      return ['/coordenador', '/coordenador/inclusao-produtiva', '/central-ajuda'];
    
    case 'coordenador_pec':
      return ['/coordenador', '/coordenador/esporte-cultura', '/central-ajuda'];
    
    case 'coordenador_psico':
      return ['/coordenador', '/coordenador/psicossocial', '/central-ajuda'];
    
    // ================ PAPÉIS EXISTENTES ================
    case 'lider':
    case 'professor_lider':
      return ['/educacao', '/professor', '/central-ajuda'];
    
    case 'aluno':
      return ['/aluno', '/central-ajuda'];
    
    case 'responsavel':
      return ['/responsavel', '/central-ajuda'];
    
    case 'conselho':
    case 'conselheiro':
      return ['/conselho', '/central-ajuda'];
    
    case 'admin':
      return ['/admin-geral', '/professor', '/monitor', '/coordenador', '/central-ajuda'];
    
    case 'super_admin':
    case 'leo':
      return ['/administrador', '/leo-martins', '/central-ajuda'];
    
    case 'desenvolvedor':
      return ['/dev', '/central-ajuda']; // DEV tem acesso universal via bypass
    
    case 'patrocinador':
      return ['/patrocinador-dashboard', '/central-ajuda'];
    
    case 'colaborador':
      return ['/colaborador', '/central-ajuda'];
    
    case 'doador':
    case 'user':
    default:
      // Usuários/doadores têm acesso APENAS às telas de doação
      return ['/tdoador', '/welcome', '/busca', '/noticias', '/perfil', '/dados-cadastrais', '/pagamentos', '/configuracoes', '/sobre', '/change-plan', '/central-ajuda'];
  }
}

// Função para obter rota padrão baseada no papel do usuário - RBAC System
function getDefaultRouteForRole(userPapel: string): string {
  switch (userPapel) {
    // ================ NOVOS PAPÉIS RBAC ================
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
    
    // ================ PAPÉIS EXISTENTES ================
    case 'super_admin':
    case 'leo':
      return '/administrador';
    case 'desenvolvedor':
      return '/dev';
    case 'admin':
      return '/admin-geral';
    case 'lider':
    case 'professor_lider':
      return '/educacao';
    case 'aluno':
      return '/aluno';
    case 'conselho':
    case 'conselheiro':
      return '/conselho';
    case 'patrocinador':
      return '/patrocinador-dashboard';
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

export default ProtectedRoute;