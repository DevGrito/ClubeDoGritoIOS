import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useDevAccess } from '@/hooks/useDevAccess';
import { isLeoByRole } from '@shared/conselho';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
  routeName: string;
}

// Mapeamento de papéis para suas rotas permitidas - RBAC System
const ROLE_TO_ALLOWED_ROUTES: Record<string, string[]> = {
  'super_admin': ['/', '/plans', '/administrador', '/leo-martins', '/central-ajuda'],
  'leo': ['/', '/plans', '/administrador', '/leo-martins', '/central-ajuda', '/tdoador', '/welcome', '/busca', '/noticias', '/perfil', '/dados-cadastrais', '/pagamentos', '/configuracoes', '/sobre', '/change-plan', '/beneficios', '/meus-lances', '/missoes-semanais'],
  'desenvolvedor': ['/', '/plans', '/dev', '/dev/marketing', '/dev/login', '/central-ajuda', '/perfil', '/dados-cadastrais', '/sobre', '/configuracoes'], // Dev tem acesso universal via hook
  'dev': ['/', '/plans', '/dev', '/dev/marketing', '/dev/login', '/central-ajuda', '/perfil', '/dados-cadastrais', '/sobre', '/configuracoes'], // Alias para desenvolvedor
  'dev-admin': ['/', '/plans', '/dev', '/dev/marketing', '/dev/login', '/central-ajuda', '/perfil', '/dados-cadastrais', '/sobre', '/configuracoes'], // Dev Admin tem acesso a AMBAS as áreas (dev + marketing)
  'dev-marketing': ['/', '/plans', '/dev/marketing', '/dev/login', '/central-ajuda', '/perfil', '/dados-cadastrais', '/sobre', '/configuracoes'], // Dev Marketing tem acesso restrito
  'admin': ['/', '/plans', '/admin-geral', '/central-ajuda', '/professor', '/monitor', '/coordenador', '/coordenador/inclusao-produtiva', '/coordenador/esporte-cultura', '/coordenador/psicossocial', '/pec', '/patrocinador-dashboard', '/perfil-patrocinador'],
  
  // ================ NOVOS PAPÉIS RBAC ================
  'professor': ['/', '/plans', '/professor', '/central-ajuda'],
  'professor_pec': ['/', '/plans', '/professor', '/central-ajuda'],
  'professor_inclusao': ['/', '/plans', '/professor', '/central-ajuda'],
  'professor_psico': ['/', '/plans', '/professor', '/central-ajuda'],
  'monitor': ['/', '/plans', '/monitor', '/central-ajuda'],
  'monitor_pec': ['/', '/plans', '/monitor', '/central-ajuda'],
  'monitor_inclusao': ['/', '/plans', '/monitor', '/central-ajuda'],
  'monitor_psico': ['/', '/plans', '/monitor', '/central-ajuda'],
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
  'patrocinador': ['/', '/plans', '/patrocinador-dashboard', '/patrocinador', '/perfil-patrocinador', '/central-ajuda'],
  'responsavel': ['/', '/plans', '/responsavel', '/central-ajuda'],
  'colaborador': ['/', '/plans', '/colaborador', '/central-ajuda'],
  
};

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = [
  '/', '/plans', '/register', '/entrar', '/verify', '/checkout', '/success', 
  '/pos-pagamento', '/aguardando-aprovacao', '/not-found', '/perfil',
  '/typeform-donation', '/donation-flow', '/stripe-payment', '/noticias',
  '/termos-servicos', '/politica-privacidade', '/pagamento/ingresso',
  '/pagamento/sucesso', '/login/developer', '/login/coordenador', '/login/monitor', '/login/professor', '/login/marketing', '/scanner-login'
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
    // 🔐 SECURITY: Verificação de papel baseada APENAS no backend (não em URL params)
    // Parâmetros de URL como ?dev_access=true NÃO concedem mais acesso
    // O papel do usuário deve vir do backend após autenticação
    const userPapel = localStorage.getItem('userPapel');
    
    // 🔐 SECURITY: Dev session válida apenas se papel for dev/desenvolvedor
    const isAuthenticatedDev = userPapel === 'desenvolvedor' || 
                               userPapel === 'dev' || 
                               userPapel === 'dev-admin' ||
                               userPapel === 'dev-marketing';
    
    if (isAuthenticatedDev) {
      console.log('✅ [DEV ACCESS] Desenvolvedor autenticado - acesso concedido');
      return;
    }
    
    // DEBUG: Log detalhado para investigação
    console.log(`🔍 [PROTECTED ROUTE DEBUG] Tentando acessar: ${routeName}`);
    console.log(`🔍 [USER SESSION] userPapel: ${userPapel}`);
    console.log(`🔍 [USER SESSION] userEmail: ${localStorage.getItem('userEmail')}`);
    console.log(`🔍 [USER SESSION] isVerified: ${localStorage.getItem('isVerified')}`);
    console.log(`🔍 [USER SESSION] hasActiveSubscription: ${localStorage.getItem('hasActiveSubscription')}`);

    // ⭐ VERIFICAÇÃO DE COORDENADOR (movida para dentro do useEffect)
    const coordenadorAuth = sessionStorage.getItem('coordenador_auth') === 'true';
    const coordenadorDataStr = sessionStorage.getItem('coordenador_data');
    const coordRoutes = ['/coordenador/inclusao-produtiva', '/coordenador/esporte-cultura', '/coordenador/psicossocial'];
    
    if (coordenadorAuth && coordenadorDataStr && coordRoutes.includes(routeName)) {
      console.log('✅ [COORDENADOR ACCESS] Acesso de coordenador autenticado - BYPASS TOTAL');
      return; // Early return dentro do useEffect é seguro
    }
    console.log(`🔍 [ALLOWED ROLES] Route expects: ${allowedRoles.join(', ')}`);
    console.log(`🔍 [ROLE ROUTES] User role allows: ${userPapel ? ROLE_TO_ALLOWED_ROUTES[userPapel]?.join(', ') : 'undefined'}`);
    
    if (routeName === '/tdoador') {
      console.log(`🎯 [DOADOR ACCESS] Tentativa de acesso à área do doador detectada!`);
      const userEmail = localStorage.getItem('userEmail');
      console.log(`🎯 [EMAIL CHECK] userEmail: ${userEmail}`);
      if (userEmail) {
        console.log(`🎯 [LEO CHECK] isLeoByRole(userPapel): ${isLeoByRole(userPapel)}`);
      }
    }
    
    // Desenvolvedores têm acesso universal (APENAS SE JÁ AUTENTICADOS)
    if (devAccess.isDeveloper || 
        devAccess.isGlobalDevMode || 
        userPapel === 'desenvolvedor' ||
        userPapel === 'dev' ||
        userPapel === 'dev-marketing') {
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
      console.log(`🎯 [LEO EARLY CHECK] isLeoMartins(email): ${userEmail ? isLeoByRole(userPapel) : 'false'}`);
      console.log(`🎯 [LEO EARLY CHECK] Phone normalized: ${normalizePhone(userTelefone || '')} === ${leoPhone}`);
      
      // Remoção da lógica automática de criação de sessão para Leo
      // Usuários devem passar pelo fluxo normal de autenticação
    }

    // Obter verificação do usuário
    const isVerified = localStorage.getItem('isVerified') === 'true';
    
    // Usuário DEV tem acesso universal mesmo logado
    if (userPapel === 'desenvolvedor' || userPapel === 'dev' || userPapel === 'dev-marketing') {
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


    // ✅ VERIFICAÇÃO DE PAGAMENTO REATIVADA
    const hasActiveSubscription = localStorage.getItem('hasActiveSubscription') === 'true';
    const subscriptionPaused = localStorage.getItem('subscriptionPaused') === 'true';
    const isRBACUser = [
      'professor', 'professor_lider', 'lider',
      'monitor', 'monitor_pec', 'monitor_inclusao', 'monitor_psico',
      'coordenador', 'coordenador_inclusao', 'coordenador_pec', 'coordenador_psico',
      'conselho', 'conselheiro',
      'admin', 'super_admin', 'desenvolvedor', 'developer', 'dev', 'leo',
      'marketing', 'gestor_setor', 'gestor_projeto',
      'oficineiro', 'oficineiro_pec', 'aluno'
    ].includes(userPapel);
    const isDonorRoute = ['/tdoador', '/welcome', '/beneficios', '/missoes', '/missoes-semanais', '/meus-lances', '/sorteio', '/impacto', '/link-indicacao'].includes(routeName);
    
    console.log(`🚨 [PAYMENT DEBUG] routeName: ${routeName}, hasActiveSubscription: ${hasActiveSubscription}, subscriptionPaused: ${subscriptionPaused}, userPapel: ${userPapel}, isRBACUser: ${isRBACUser}, isDonorRoute: ${isDonorRoute}`);
    
    // Se é uma rota de doador e não tem assinatura ativa, redirecionar
    if (isDonorRoute && !isRBACUser && !hasActiveSubscription) {
      console.log(`🚨 [PAYMENT BLOCK] Usuário sem assinatura ativa tentando acessar área de doador`);
      toast({
        title: "Assinatura inativa",
        description: "Sua assinatura precisa ser reativada para acessar esta área.",
        variant: "destructive",
      });
      setLocation('/assinatura-pausada');
      return;
    }

    // ESPECIAL: Verificar se é Leo Martins tentando acessar sua área administrativa  
    if (userEmail && isLeoByRole(userPapel) && routeName === '/leo-martins') {
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
    case 'professor_pec':
    case 'professor_inclusao':
    case 'professor_psico':
      return ['/professor', '/central-ajuda'];
    
    case 'monitor':
    case 'monitor_pec':
    case 'monitor_inclusao':
    case 'monitor_psico':
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
    case 'professor_pec':
    case 'professor_inclusao':
    case 'professor_psico':
      return '/professor';
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
    
    // ================ PAPÉIS EXISTENTES ================
    case 'super_admin':
    case 'leo':
      return '/administrador';
    case 'desenvolvedor':
      return '/dev';
    case 'dev':
      return '/dev';
    case 'dev-marketing':
      return '/dev/marketing';
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