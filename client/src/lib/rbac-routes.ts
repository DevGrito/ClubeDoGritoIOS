import { isLeoByRole } from '@shared/conselho';

export const DONOR_APP_ROUTES = [
  '/tdoador', '/welcome', '/beneficios', '/beneficios-onboarding',
  '/missoes', '/missoes-semanais', '/meus-lances', '/sorteio',
  '/impacto', '/link-indicacao', '/link-afiliado-cadastro',
];

// Mapeamento de papéis para suas rotas permitidas - RBAC System
export const ROLE_TO_ALLOWED_ROUTES: Record<string, string[]> = {
  'super_admin': ['/', '/plans', '/administrador', '/leo-martins', '/central-ajuda', '/admin/privacy-consents', '/admin/ropa', '/dev', '/coordenador/negocios-sociais', '/coordenador/almoxarifado', '/dashboard/gestao/vista', '/gestao-vista'],
  'leo': ['/', '/plans', '/administrador', '/leo-martins', '/central-ajuda', '/tdoador', '/welcome', '/busca', '/noticias', '/perfil', '/meus-dados', '/dados-cadastrais', '/pagamentos', '/configuracoes', '/sobre', '/change-plan', '/beneficios', '/meus-lances', '/missoes-semanais', '/impacto', '/sorteio', '/link-indicacao', '/admin/privacy-consents', '/admin/ropa', '/dev', '/coordenador/negocios-sociais', '/coordenador/almoxarifado', '/dashboard/gestao/vista', '/gestao-vista'],
  'desenvolvedor': ['/', '/plans', '/dev', '/dev/marketing', '/dev/login', '/administrador', '/central-ajuda', '/perfil', '/meus-dados', '/dados-cadastrais', '/sobre', '/configuracoes', '/admin/privacy-consents', '/dashboard/gestao/vista', '/gestao-vista'],
  'dev': ['/', '/plans', '/dev', '/dev/marketing', '/dev/login', '/administrador', '/central-ajuda', '/perfil', '/meus-dados', '/dados-cadastrais', '/sobre', '/configuracoes', '/admin/privacy-consents', '/dashboard/gestao/vista', '/gestao-vista'],
  'dev-admin': ['/', '/plans', '/dev', '/dev/marketing', '/dev/login', '/administrador', '/central-ajuda', '/perfil', '/meus-dados', '/dados-cadastrais', '/sobre', '/configuracoes', '/dashboard/gestao/vista'],
  'dev-marketing': ['/', '/plans', '/dev/marketing', '/dev/login', '/central-ajuda', '/perfil', '/meus-dados', '/dados-cadastrais', '/sobre', '/configuracoes'],
  'admin': ['/', '/plans', '/admin-geral', '/central-ajuda', '/professor', '/professor/pec', '/professor/inclusao', '/monitor', '/coordenador', '/coordenador/inclusao-produtiva', '/coordenador/esporte-cultura', '/coordenador/psicossocial', '/coordenador/negocios-sociais', '/coordenador/almoxarifado', '/pec', '/patrocinador-dashboard', '/perfil-patrocinador', '/admin/privacy-consents', '/dashboard/gestao/vista', '/gestao-vista'],

  'professor': ['/', '/plans', '/professor', '/professor/pec', '/professor/inclusao', '/central-ajuda', '/meus-dados'],
  'professor_pec': ['/', '/plans', '/professor', '/professor/pec', '/central-ajuda', '/meus-dados'],
  'professor_inclusao': ['/', '/plans', '/professor', '/professor/inclusao', '/central-ajuda', '/meus-dados'],
  'professor_psico': ['/', '/plans', '/professor', '/professor/pec', '/professor/inclusao', '/central-ajuda', '/meus-dados'],
  'marketing': ['/', '/plans', '/rbac/marketing', '/central-ajuda', '/perfil', '/meus-dados', '/dados-cadastrais', '/sobre', '/configuracoes'],
  'monitor': ['/', '/plans', '/monitor', '/monitor/pec', '/monitor/inclusao', '/central-ajuda', '/meus-dados'],
  'monitor_pec': ['/', '/plans', '/monitor', '/monitor/pec', '/central-ajuda', '/meus-dados'],
  'monitor_inclusao': ['/', '/plans', '/monitor', '/monitor/inclusao', '/central-ajuda', '/meus-dados'],
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
  'aluno_portal': ['/', '/plans', '/aluno', '/central-ajuda', '/meus-dados'],
  'doador': ['/', '/plans', '/tdoador', '/welcome', '/busca', '/noticias', '/perfil', '/meus-dados', '/dados-cadastrais', '/pagamentos', '/configuracoes', '/sobre', '/change-plan', '/central-ajuda', ...DONOR_APP_ROUTES],
  'user': ['/', '/plans', '/tdoador', '/welcome', '/busca', '/noticias', '/perfil', '/meus-dados', '/dados-cadastrais', '/pagamentos', '/configuracoes', '/sobre', '/change-plan', '/central-ajuda', ...DONOR_APP_ROUTES],
  'conselho': ['/', '/plans', '/conselho', '/central-ajuda', '/perfil', '/meus-dados', '/dados-cadastrais', '/sobre', '/configuracoes', '/gestao-vista', '/dashboard/gestao/vista'],
  'conselheiro': ['/', '/plans', '/conselho', '/central-ajuda', '/perfil', '/meus-dados', '/dados-cadastrais', '/sobre', '/configuracoes', '/gestao-vista', '/dashboard/gestao/vista'],
  'patrocinador': ['/', '/plans', '/patrocinador-dashboard', '/patrocinador', '/perfil-patrocinador', '/meus-dados', '/central-ajuda'],
  'responsavel': ['/', '/plans', '/responsavel', '/central-ajuda'],
  'colaborador': ['/', '/plans', '/colaborador', '/central-ajuda'],
};

export const PUBLIC_ROUTES = [
  '/', '/plans', '/register', '/entrar', '/verify', '/checkout', '/success',
  '/pos-pagamento', '/aguardando-aprovacao', '/not-found', '/perfil',
  '/typeform-donation', '/donation-flow', '/stripe-payment', '/noticias',
  '/termos-servicos', '/politica-privacidade', '/pagamento/ingresso',
  '/pagamento/sucesso', '/login/developer', '/login/coordenador', '/login/monitor', '/login/professor', '/login/marketing', '/scanner-login', '/tablet/chamada/login',
  '/reativar-assinatura',
  '/dashboard/gestao/vista', '/gestao-vista-preview',
];

export const DEV_ROLES = new Set(['desenvolvedor', 'dev', 'dev-admin', 'dev-marketing']);

/** Portal do aluno usa papel aluno_portal na sessão; RBAC trata como aluno. */
export function normalizeRbacRole(papel: string): string {
  if (papel === 'aluno_portal') return 'aluno';
  return papel;
}

export function getDefaultRouteForRole(userPapel: string): string {
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

function stripPath(path: string): string {
  const p = (path || '/').split('?')[0].split('#')[0];
  return p || '/';
}

export function isPublicRbacRoute(path: string): boolean {
  return PUBLIC_ROUTES.includes(stripPath(path));
}

/**
 * O papel informado pode acessar a rota?
 * - Papéis dev: acesso liberado (igual ao ProtectedRoute).
 * - Papel desconhecido/sem mapa: permissivo (deixa o ProtectedRoute decidir).
 * - Demais papéis: restrito às rotas mapeadas (prefixo).
 */
export function canRoleAccessRoute(rawRole: string, path: string): boolean {
  const role = normalizeRbacRole((rawRole || '').trim());
  if (!role) return false;
  if (DEV_ROLES.has(role)) return true;

  const p = stripPath(path);
  if (isLeoByRole(role) && p === '/leo-martins') return true;

  const allowed = ROLE_TO_ALLOWED_ROUTES[role];
  if (!allowed) return true; // papel não mapeado: não bloquear aqui

  return allowed.some((a) => p === a || (a !== '/' && p.startsWith(`${a}/`)));
}
