import type { Request } from "express";

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
  portalUserId?: number;
  actorType?: string;
  userPapel?: string;
  userId?: number;
  userName?: string;
  [key: string]: unknown;
};

/** Acesso tipado à sessão Express sem TS2352. */
export function getPortalSession(req: Request): PortalSession {
  return (req.session ?? {}) as unknown as PortalSession;
}

export function getMutablePortalSession(req: Request): PortalSession {
  if (!req.session) {
    throw new Error("Sessão indisponível");
  }
  return req.session as unknown as PortalSession;
}
