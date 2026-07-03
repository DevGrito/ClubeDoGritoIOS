import type { AuthSessionPayload } from "@/lib/auth-session";
import { isAlunoPortalSession, getAlunoPortalCpf } from "@/lib/auth-session";

/** Rota pós-login com base na sessão confirmada pelo backend (fonte de verdade). */
export function getPostLoginPath(session: AuthSessionPayload): string {
  const role = String(session.papel || session.role || "").toLowerCase();

  if (isAlunoPortalSession(session) && getAlunoPortalCpf(session)) {
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
