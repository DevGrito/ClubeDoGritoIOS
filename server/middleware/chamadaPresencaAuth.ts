import type { Request, Response, NextFunction } from "express";

const AUDITORIA_ROLES = ["leo", "super_admin", "desenvolvedor", "dev", "dev-admin"] as const;

const PRESENCA_STAFF_ROLES = [
  "monitor",
  "monitor_pec",
  "monitor_inclusao",
  "monitor_psico",
  "coordenador",
  "coordenador_pec",
  "coordenador_inclusao",
  "coordenador_psico",
  "professor",
  "professor_pec",
  "professor_inclusao",
  "professor_psico",
] as const;

const PORTAL_ACTORS_BLOCKED = new Set(["aluno", "aluno_portal", "scanner", "doador", "user"]);

function userRole(req: Request): string {
  const user = (req as Request & { user?: { papel?: string; role?: string; userPapel?: string } }).user;
  return String(user?.papel || user?.role || user?.userPapel || "").toLowerCase();
}

function userActor(req: Request): string {
  const user = (req as Request & { user?: { actorType?: string; papel?: string } }).user;
  return String(user?.actorType || user?.papel || "").toLowerCase();
}

function isTabletChamadaSession(req: Request): boolean {
  const sess = req.session as { actorType?: string; tabletChamadaUserId?: number } | undefined;
  return sess?.actorType === "tablet_chamada" && !!sess.tabletChamadaUserId;
}

function denyBlockedPortalActors(req: Request, res: Response): boolean {
  const actor = userActor(req);
  const role = userRole(req);
  if (PORTAL_ACTORS_BLOCKED.has(actor) || PORTAL_ACTORS_BLOCKED.has(role)) {
    res.status(403).json({ error: "Acesso negado" });
    return true;
  }
  return false;
}

function vertenteFromRequest(req: Request): string {
  return String(req.query.vertente || (req.body as { vertente?: string })?.vertente || "").toLowerCase();
}

/** Auditoria de chamadas — somente Léo e equipe dev. */
export function requireChamadasAuditoriaAccess(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!(req as Request & { user?: unknown }).user) {
    res.status(401).json({ error: "Autenticação obrigatória" });
    return;
  }
  if (denyBlockedPortalActors(req, res)) return;
  if (isTabletChamadaSession(req)) {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }
  const role = userRole(req);
  if (!(AUDITORIA_ROLES as readonly string[]).includes(role)) {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }
  next();
}

/** Status/troca de senha manual — somente coordenador da vertente. */
export function requirePresencaManualCoordenadorSenha(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!(req as Request & { user?: unknown }).user) {
    res.status(401).json({ error: "Autenticação obrigatória" });
    return;
  }
  if (denyBlockedPortalActors(req, res)) return;
  if (isTabletChamadaSession(req)) {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  const role = userRole(req);
  const vert = vertenteFromRequest(req);
  if (vert !== "pec" && vert !== "inclusao") {
    res.status(400).json({ error: "vertente inválida" });
    return;
  }
  if (role === "coordenador_pec" && vert === "pec") {
    next();
    return;
  }
  if (role === "coordenador_inclusao" && vert === "inclusao") {
    next();
    return;
  }
  res.status(403).json({ error: "Acesso negado" });
}

/** Validação da senha de chamada manual — staff de presença ou tablet autenticado. */
export function requireValidarPinManualAccess(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!(req as Request & { user?: unknown }).user) {
    res.status(401).json({ error: "Autenticação obrigatória" });
    return;
  }
  const role = userRole(req);
  const actor = userActor(req);
  if (actor === "tablet_chamada" || role === "tablet_chamada" || isTabletChamadaSession(req)) {
    next();
    return;
  }
  if (denyBlockedPortalActors(req, res)) return;
  if ((PRESENCA_STAFF_ROLES as readonly string[]).includes(role)) {
    next();
    return;
  }
  res.status(403).json({ error: "Acesso negado" });
}

/** Registro de ativação do modo manual — staff de presença ou tablet autenticado. */
export function requireChamadaManualLogAccess(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  requireValidarPinManualAccess(req, res, next);
}

/** Impede gravação de log em vertente incompatível com o ator da sessão. */
export function assertVertentePermitidaParaChamadaManual(
  req: Request,
  vertente: string | null
): { ok: true } | { ok: false; status: number; error: string } {
  const vert = String(vertente || "").toLowerCase();
  if (!vert || (vert !== "pec" && vert !== "inclusao")) {
    return { ok: true };
  }

  const user = (req as Request & { user?: { vertente?: string }; tabletChamadaVertente?: string }).user;
  const role = userRole(req);
  const actor = userActor(req);

  if (actor === "tablet_chamada" || isTabletChamadaSession(req)) {
    const sess = req.session as { tabletChamadaVertente?: string } | undefined;
    const sessVert = String(
      user?.vertente || (req as Request & { tabletChamadaVertente?: string }).tabletChamadaVertente || sess?.tabletChamadaVertente || ""
    ).toLowerCase();
    if (sessVert && vert !== sessVert) {
      return { ok: false, status: 403, error: "Vertente não autorizada para esta sessão" };
    }
    return { ok: true };
  }

  const pecOnly = new Set(["coordenador_pec", "monitor_pec", "professor_pec"]);
  const incOnly = new Set(["coordenador_inclusao", "monitor_inclusao", "professor_inclusao"]);

  if (pecOnly.has(role) && vert !== "pec") {
    return { ok: false, status: 403, error: "Vertente não autorizada para seu perfil" };
  }
  if (incOnly.has(role) && vert !== "inclusao") {
    return { ok: false, status: 403, error: "Vertente não autorizada para seu perfil" };
  }

  return { ok: true };
}
