import type { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { senhaManualAttemptLimiter } from "./rateLimit";

/** Cookie de sessão válido por 24h após desbloqueio com senha de visualização. */
export const GESTAO_VISTA_VIEW_UNLOCK_MS = 24 * 60 * 60 * 1000;

const STAFF_BYPASS_ROLES = new Set([
  "super_admin",
  "leo",
  "desenvolvedor",
  "dev",
  "dev-admin",
  "conselho",
  "conselheiro",
  "admin",
]);

const UNLOCK_PUBLIC_PATHS = new Set([
  "/api/gestao-vista/unlock",
  "/api/gestao-vista/unlock/status",
]);

const PROTECTED_PREFIXES = ["/api/gestao-vista", "/api/gestao-vista-data"];

function normalizePath(url: string): string {
  return url.split("?")[0];
}

function getStaffRole(req: Request): string | null {
  const sess = req.session as Record<string, unknown> | undefined;
  const user = (sess?.user as Record<string, unknown> | undefined) ?? {};
  const papel = user.papel ?? sess?.papel ?? sess?.userPapel ?? null;
  return papel ? String(papel).toLowerCase() : null;
}

export function hasGestaoVistaViewAccess(req: Request): boolean {
  const role = getStaffRole(req);
  if (role && STAFF_BYPASS_ROLES.has(role)) return true;

  const sess = req.session as { gestaoVistaViewUnlockedAt?: number } | undefined;
  const unlockedAt = sess?.gestaoVistaViewUnlockedAt;
  if (typeof unlockedAt !== "number") return false;
  return Date.now() - unlockedAt < GESTAO_VISTA_VIEW_UNLOCK_MS;
}

function isPasswordConfigured(): boolean {
  return Boolean(
    process.env.GESTAO_VISTA_VIEW_PASSWORD?.trim() ||
      process.env.GESTAO_VISTA_VIEW_PASSWORD_HASH?.trim()
  );
}

function stripEnvQuotes(value: string): string {
  const v = value.trim();
  if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
    return v.slice(1, -1);
  }
  return v;
}

function isValidBcryptHash(value: string): boolean {
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(value);
}

async function verifyViewPassword(senha: string): Promise<boolean> {
  let hash = process.env.GESTAO_VISTA_VIEW_PASSWORD_HASH?.trim();
  let plain = process.env.GESTAO_VISTA_VIEW_PASSWORD?.trim();

  if (!hash && !plain) return false;

  if (hash) {
    hash = stripEnvQuotes(hash);
    if (isValidBcryptHash(hash)) {
      return bcrypt.compare(senha, hash);
    }
    console.warn(
      "[GESTAO-VISTA] GESTAO_VISTA_VIEW_PASSWORD_HASH inválido/corrompido — usando senha em texto se disponível."
    );
  }

  if (!plain) return false;

  plain = stripEnvQuotes(plain);

  const a = Buffer.from(senha);
  const b = Buffer.from(plain);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function isGestaoVistaDataPath(path: string): boolean {
  return PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

function isDashboardScopedRequest(req: Request): boolean {
  return String(req.headers["x-gv-dashboard"] ?? "") === "1";
}

export function gestaoVistaViewAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const path = normalizePath(req.originalUrl);

  if (!isGestaoVistaDataPath(path)) return next();
  if (UNLOCK_PUBLIC_PATHS.has(path)) return next();

  // Rotas de escrita (importação/admin) seguem fluxo existente.
  if (req.method !== "GET") return next();

  // Outras telas (welcome, impacto, etc.) continuam usando a API sem senha.
  if (!isDashboardScopedRequest(req)) return next();

  if (hasGestaoVistaViewAccess(req)) return next();

  return res.status(401).json({
    error: "Acesso restrito. Informe a senha de visualização.",
    code: "GESTAO_VISTA_LOCKED",
  });
}

export function registerGestaoVistaViewRoutes(app: Express) {
  app.get("/api/gestao-vista/unlock/status", (req, res) => {
    const unlocked = hasGestaoVistaViewAccess(req);
    const sess = req.session as { gestaoVistaViewUnlockedAt?: number } | undefined;
    const unlockedAt = sess?.gestaoVistaViewUnlockedAt;
    const expiresAt =
      typeof unlockedAt === "number" ? unlockedAt + GESTAO_VISTA_VIEW_UNLOCK_MS : null;

    res.json({
      unlocked,
      expiresAt: unlocked && expiresAt ? expiresAt : null,
      configured: isPasswordConfigured(),
    });
  });

  app.post(
    "/api/gestao-vista/unlock",
    senhaManualAttemptLimiter,
    async (req, res) => {
      try {
        const senha = String(req.body?.senha ?? "").trim();
        if (!senha) {
          return res.status(400).json({ error: "Senha obrigatória" });
        }

        if (!isPasswordConfigured()) {
          return res.status(503).json({
            error: "Senha de visualização não configurada no servidor.",
          });
        }

        const ok = await verifyViewPassword(senha);
        if (!ok) {
          return res.status(401).json({ error: "Senha incorreta" });
        }

        const sess = req.session as { gestaoVistaViewUnlockedAt?: number };
        sess.gestaoVistaViewUnlockedAt = Date.now();

        await new Promise<void>((resolve, reject) => {
          req.session.save((err) => (err ? reject(err) : resolve()));
        });

        return res.json({
          ok: true,
          expiresAt: Date.now() + GESTAO_VISTA_VIEW_UNLOCK_MS,
        });
      } catch (err) {
        console.error("[GESTAO-VISTA] unlock error:", err);
        return res.status(500).json({ error: "Erro ao desbloquear" });
      }
    }
  );

  app.use(gestaoVistaViewAuthMiddleware);
}
