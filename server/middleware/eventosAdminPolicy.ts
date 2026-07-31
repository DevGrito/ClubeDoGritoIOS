import { isAdminEmail } from "@shared/conselho";

export const EVENTOS_ADMIN_ROLES = new Set([
  "admin",
  "super_admin",
  "coordenador",
  "dev",
  "desenvolvedor",
  "marketing",
]);

export const EVENTOS_ADMIN_DENIED_ACTORS = new Set([
  "eventos_portal",
  "aluno_portal",
  "aluno",
  "scanner",
  "tablet_chamada",
]);

export type EventosAdminUser = {
  papel?: string | null;
  role?: string | null;
  tipo?: string | null;
  actorType?: string | null;
  email?: string | null;
  coordenadorId?: number | null;
} | null;

/**
 * Política única de administração do portal de eventos.
 * Permitidos: admin, super_admin, coordenador, dev, desenvolvedor, marketing.
 */
export function canAccessEventosAdmin(
  user: EventosAdminUser,
  opts?: { isDeveloper?: boolean }
): boolean {
  if (!user) return false;

  const role = String(user.papel || user.role || user.tipo || "").toLowerCase();
  const actor = String(user.actorType || "").toLowerCase();

  if (EVENTOS_ADMIN_DENIED_ACTORS.has(actor) || EVENTOS_ADMIN_DENIED_ACTORS.has(role)) {
    return false;
  }

  if ((user.email && isAdminEmail(user.email)) || opts?.isDeveloper) {
    return true;
  }

  if (EVENTOS_ADMIN_ROLES.has(role)) {
    return true;
  }

  // Sessão de coordenador sem papel explícito, mas com coordenadorId
  if (user.coordenadorId && (actor === "coordenador" || role === "")) {
    return true;
  }

  return false;
}

export function isStaffAuthBlockedByPortalSession(session: {
  actorType?: string;
  portalUserId?: number;
}): boolean {
  return session.actorType === "eventos_portal" || !!session.portalUserId;
}
