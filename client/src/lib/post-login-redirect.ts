import type { AuthSessionPayload } from "@/lib/auth-session";
import { canRoleAccessRoute, normalizeRbacRole } from "@/lib/rbac-routes";
import { normalizePushPath } from "@/lib/pushNavigationGate";

/** Lê ?redirect= da URL atual (após login por clique de push). */
export function readRedirectFromLocation(search?: string): string | null {
  try {
    const q = search ?? (typeof window !== "undefined" ? window.location.search : "");
    const raw = new URLSearchParams(q).get("redirect");
    if (!raw) return null;
    const path = normalizePushPath(decodeURIComponent(raw));
    if (!path.startsWith("/") || path.startsWith("//")) return null;
    return path;
  } catch {
    return null;
  }
}

/**
 * Se o redirect for seguro para o papel logado, usa-o; senão cai no mapa padrão.
 */
export function getPostLoginPath(
  session: AuthSessionPayload,
  redirectParam?: string | null
): string {
  const role = String(session.papel || session.role || "").toLowerCase();

  if (redirectParam) {
    const path = normalizePushPath(redirectParam);
    const actorRole =
      session.actorType === "aluno_portal" ? "aluno_portal" : normalizeRbacRole(role);
    if (path.startsWith("/") && canRoleAccessRoute(actorRole || role, path)) {
      return path;
    }
  }

  if (session.actorType === "aluno_portal" && session.cpf) {
    return "/aluno";
  }
  if (session.actorType === "scanner") {
    return "/scanner";
  }

  const map: Record<string, string> = {
    super_admin: "/administrador",
    leo: "/tdoador",
    admin: "/admin-geral",
    desenvolvedor: "/dev",
    dev: "/dev",
    "dev-admin": "/dev",
    "dev-marketing": "/dev/marketing",
    marketing: "/rbac/marketing",
    professor: "/professor",
    professor_pec: "/professor/pec",
    professor_inclusao: "/professor/inclusao",
    professor_psico: "/professor",
    monitor: "/monitor",
    monitor_pec: "/monitor/pec",
    monitor_inclusao: "/monitor/inclusao",
    monitor_psico: "/monitor/psico",
    coordenador_inclusao: "/coordenador/inclusao-produtiva",
    coordenador_pec: "/coordenador/esporte-cultura",
    coordenador_psico: "/coordenador/psicossocial",
    tecnica_psico: "/tecnica/psicossocial",
    coordenador_negocios: "/coordenador/negocios-sociais",
    coordenador_almoxarifado: "/coordenador/almoxarifado",
    conselho: "/conselho",
    conselheiro: "/conselho",
    patrocinador: "/patrocinador",
    doador: "/tdoador",
    user: "/tdoador",
    aluno: "/aluno",
    aluno_portal: "/aluno",
  };

  return map[role] || "/tdoador";
}
