import type { Request, Response, NextFunction } from "express";
import { getPortalSession, getMutablePortalSession, type PortalSession } from "./portalSession";

export type { PortalSession };

export async function saveExpressSession(req: Request): Promise<void> {
  const sess = getPortalSession(req) as PortalSession & { save?: (cb: (err?: Error) => void) => void };
  if (sess?.save) {
    await new Promise<void>((resolve, reject) =>
      sess.save!((err) => (err ? reject(err) : resolve()))
    );
  }
}

/** Regenera ID da sessão (mitiga session fixation após login). */
export async function regenerateExpressSession(req: Request): Promise<void> {
  const sess = req.session as { regenerate?: (cb: (err?: Error) => void) => void } | undefined;
  if (!sess?.regenerate) return;
  await new Promise<void>((resolve, reject) =>
    sess.regenerate!((err) => (err ? reject(err) : resolve()))
  );
}

/** Limpa campos de outros atores antes de gravar sessão de portal. */
export function clearCrossActorSessionFields(sess: PortalSession): void {
  delete sess.user;
  delete sess.userId;
  delete sess.userPapel;
  delete sess.userEmail;
  delete sess.userName;
  delete sess.isCoordinator;
  delete sess.coordenador;
  delete sess.coordenadorId;
  delete sess.coordenadorEmail;
  delete sess.coordenadorNome;
  delete sess.coordenadorSetor;
  delete sess.portalUserId;
  delete sess.alunoCpf;
  delete sess.alunoTipo;
  delete sess.alunoNome;
  delete sess.scannerUserId;
  delete sess.scannerNome;
  delete sess.scannerUsername;
  delete sess.tabletChamadaUserId;
  delete sess.tabletChamadaNome;
  delete sess.tabletChamadaUsername;
  delete sess.tabletChamadaVertente;
  delete sess.actorType;
  delete sess.actorId;
  delete sess.developerId;
  delete sess.devSession;
  delete sess.isDeveloper;
  delete sess.telefone;
  delete sess.nome;
}

export function getAlunoCpfFromRequest(req: Request): string {
  return String((req as Request & { alunoCpf?: string }).alunoCpf || "").replace(/\D/g, "");
}

export function requireAlunoPortalAuth(req: Request, res: Response, next: NextFunction): void {
  const sess = getPortalSession(req);
  const cpf = String(sess?.alunoCpf || "").replace(/\D/g, "");
  if (!cpf || sess?.actorType !== "aluno_portal") {
    res.status(401).json({ error: "Autenticação obrigatória" });
    return;
  }

  const queryCpf = String(req.query.cpf || "").replace(/\D/g, "");
  const bodyCpf = String((req.body as { cpf?: string })?.cpf || "").replace(/\D/g, "");
  if ((queryCpf && queryCpf !== cpf) || (bodyCpf && bodyCpf !== cpf)) {
    res.status(403).json({ error: "Acesso negado" });
    return;
  }

  (req as Request & { alunoCpf: string }).alunoCpf = cpf;
  next();
}

export function requireScannerAuth(req: Request, res: Response, next: NextFunction): void {
  const sess = getPortalSession(req);
  const scannerUserId = sess?.scannerUserId;
  if (!scannerUserId || sess?.actorType !== "scanner") {
    res.status(401).json({ error: "Autenticação obrigatória" });
    return;
  }
  (req as Request & { scannerUserId: number }).scannerUserId = Number(scannerUserId);
  next();
}

export function requireTabletChamadaAuth(req: Request, res: Response, next: NextFunction): void {
  const sess = getPortalSession(req);
  const tabletChamadaUserId = sess?.tabletChamadaUserId;
  const vertente = sess?.tabletChamadaVertente;
  if (!tabletChamadaUserId || sess?.actorType !== "tablet_chamada" || !vertente) {
    res.status(401).json({ error: "Autenticação obrigatória" });
    return;
  }
  if (vertente !== "pec" && vertente !== "inclusao") {
    res.status(403).json({ error: "Sessão inválida" });
    return;
  }
  (req as Request & { tabletChamadaUserId: number; tabletChamadaVertente: "pec" | "inclusao" }).tabletChamadaUserId =
    Number(tabletChamadaUserId);
  (req as Request & { tabletChamadaUserId: number; tabletChamadaVertente: "pec" | "inclusao" }).tabletChamadaVertente =
    vertente;
  next();
}

export async function establishAlunoPortalSession(
  req: Request,
  data: { cpf: string; tipo: string; nome: string; studentId?: number | null }
): Promise<void> {
  const sess = getMutablePortalSession(req);

  clearCrossActorSessionFields(sess);
  const cpfLimpo = data.cpf.replace(/\D/g, "");
  sess.alunoCpf = cpfLimpo;
  sess.alunoTipo = data.tipo;
  sess.alunoNome = data.nome;
  sess.actorType = "aluno_portal";
  sess.userPapel = "aluno_portal";
  sess.userId = data.studentId ?? (Number.parseInt(cpfLimpo.slice(-9), 10) || 1);
  sess.actorId = sess.userId;
  await saveExpressSession(req);
}

export async function establishScannerSession(
  req: Request,
  usuario: { id: number; nome: string; username: string }
): Promise<void> {
  const sess = getMutablePortalSession(req);

  clearCrossActorSessionFields(sess);
  sess.scannerUserId = usuario.id;
  sess.scannerNome = usuario.nome;
  sess.scannerUsername = usuario.username;
  sess.actorType = "scanner";
  sess.userPapel = "scanner";
  sess.userId = usuario.id;
  sess.userName = usuario.nome;
  sess.actorId = usuario.id;
  await saveExpressSession(req);
}

export async function establishTabletChamadaSession(
  req: Request,
  usuario: { id: number; nome: string; username: string; vertente: "pec" | "inclusao" }
): Promise<void> {
  const sess = getMutablePortalSession(req);

  clearCrossActorSessionFields(sess);
  sess.tabletChamadaUserId = usuario.id;
  sess.tabletChamadaNome = usuario.nome;
  sess.tabletChamadaUsername = usuario.username;
  sess.tabletChamadaVertente = usuario.vertente;
  sess.actorType = "tablet_chamada";
  sess.userPapel = "tablet_chamada";
  sess.userId = usuario.id;
  sess.userName = usuario.nome;
  sess.actorId = usuario.id;
  await saveExpressSession(req);
}

/**
 * Sessão pública do portal de eventos.
 * NÃO grava userId/userPapel genéricos — isso faria o usuário passar por requireAuth administrativo.
 */
export async function establishEventosPortalSession(
  req: Request,
  usuario: { id: number; nome: string }
): Promise<void> {
  await regenerateExpressSession(req);
  const sess = getMutablePortalSession(req);

  clearCrossActorSessionFields(sess);
  sess.portalUserId = usuario.id;
  sess.actorType = "eventos_portal";
  await saveExpressSession(req);
}

export function requireEventosPortalAuth(req: Request, res: Response, next: NextFunction): void {
  const sess = getPortalSession(req);
  const portalUserId = sess?.portalUserId;
  if (!portalUserId || sess?.actorType !== "eventos_portal") {
    res.status(401).json({ error: "Não autenticado" });
    return;
  }
  (req as Request & { portalUserId: number }).portalUserId = Number(portalUserId);
  next();
}

export function getPortalUserIdFromRequest(req: Request): number | null {
  const sess = getPortalSession(req);
  if (!sess?.portalUserId || sess.actorType !== "eventos_portal") return null;
  return Number(sess.portalUserId) || null;
}

export async function destroyExpressSession(req: Request, res: Response): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    if (!req.session?.destroy) {
      resolve();
      return;
    }
    req.session.destroy((err?: Error) => (err ? reject(err) : resolve()));
  });
  res.clearCookie("og.sid");
}
