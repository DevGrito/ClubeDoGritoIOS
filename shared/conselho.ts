// ================ SEGURANÇA: VERIFICAÇÃO DE CONSELHO ================
// IMPORTANTE: Todas as verificações de email/telefone são feitas pelo BACKEND
// através da tabela `conselheiros` no banco de dados.
// Este arquivo mantém apenas funções de compatibilidade que retornam false.
// A verificação real é feita pelo endpoint /api/auth/login-email

// Função de compatibilidade - verificação real feita no backend
export function isConselhoEmail(email: string): boolean {
  // ⚠️ DEPRECATED: Verificação agora é feita no banco de dados
  // Esta função mantida para compatibilidade, sempre retorna false
  // Use o endpoint /api/auth/login-email para verificação real
  console.warn('⚠️ isConselhoEmail está deprecated - use verificação do backend');
  return false;
}

// Função de compatibilidade - verificação real feita no backend
export function isAdminEmail(email: string): boolean {
  // ⚠️ DEPRECATED: Verificação agora é feita no banco de dados
  console.warn('⚠️ isAdminEmail está deprecated - use verificação do backend');
  return false;
}

// Função de compatibilidade - verificação real feita no backend
export function isLeoMartins(email: string): boolean {
  // ⚠️ DEPRECATED: Verificação agora é feita no banco de dados
  // O Léo é identificado pelo role='leo' no banco de dados
  console.warn('⚠️ isLeoMartins está deprecated - use verificação do backend');
  return false;
}

// Função para verificar se é o Léo Martins baseado no papel (role)
// Esta é a forma segura de verificar - usa o papel retornado pelo backend
export function isLeoByRole(role: string | null | undefined): boolean {
  return role === 'leo';
}

// Função para verificar se é conselheiro baseado no papel (role)
export function isConselhoByRole(role: string | null | undefined): boolean {
  return role === 'conselho' || role === 'conselheiro';
}

// Função para verificar se é admin baseado no papel (role)
export function isAdminByRole(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'super_admin';
}
