/** Rota de retorno ao painel administrativo conforme o papel do usuário. */
export function adminReturnPath(role?: string | null): string {
  if (role === "admin") return "/admin-geral";
  if (role === "desenvolvedor" || role === "dev" || role === "dev-admin") return "/dev";
  return "/administrador";
}
