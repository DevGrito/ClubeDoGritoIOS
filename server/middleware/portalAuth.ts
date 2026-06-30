import type { Request, Response, NextFunction } from "express";

export type PortalSession = {
  alunoCpf?: string;
  alunoTipo?: string;
  alunoNome?: string;
  scannerUserId?: number;
  scannerNome?: string;
  scannerUsername?: string;
  tabletChamadaUserId?: number;
  tabletChamadaNome?: string;
  tabletChamadaUsername?: string;
  tabletChamadaVertente?: "pec" | "inclusao";
  actorType?: string;
  userPapel?: string;
  userId?: number;
};

export async function saveExpressSession(req: Request): Promise<void> {
  const sess = req.session as PortalSession & { save?: (cb: (err?: Error) => void) => void };
  if (sess?.save) {
    await new Promise<void>((resolve, reject) =>
      sess.save!((err) => (err ? reject(err) : resolve()))
    );
  }
}

/** Regenera ID da sessão (mitiga session fixation após login). */
export async function regenerateExpressSession(req: Request): Promise<void> {
  const sess = req.session as { regenerate?: (cb: (err?: Error) => void) => void };
  if (!sess?.regenerate) return;
  await new Promise<void>((resolve, reject) =>
    sess.regenerate!((err) => (err ? reject(err) : resolve()))
  );
}

/** Limpa campos de outros atores antes de gravar sessão de portal. */
export function clearCrossActorSessionFields(sess: PortalSession & Record<string, unknown>): void {
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
  const sess = req.session as PortalSession;
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
  const sess = req.session as PortalSession;
  const scannerUserId = sess?.scannerUserId;
  if (!scannerUserId || sess?.actorType !== "scanner") {
    res.status(401).json({ error: "Autenticação obrigatória" });
    return;
  }
  (req as Request & { scannerUserId: number }).scannerUserId = scannerUserId;
  next();
}

export function requireTabletChamadaAuth(req: Request, res: Response, next: NextFunction): void {
  const sess = req.session as PortalSession;
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
    tabletChamadaUserId;
  (req as Request & { tabletChamadaUserId: number; tabletChamadaVertente: "pec" | "inclusao" }).tabletChamadaVertente =
    vertente;
  next();
}

export async function establishAlunoPortalSession(
  req: Request,
  data: { cpf: string; tipo: string; nome: string; studentId?: number | null }
): Promise<void> {
  const sess = req.session as PortalSession & Record<string, unknown>;
  if (!sess) return;

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
  const sess = req.session as PortalSession & Record<string, unknown>;
  if (!sess) return;

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
  const sess = req.session as PortalSession & Record<string, unknown>;
  if (!sess) return;

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
