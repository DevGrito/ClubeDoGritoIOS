import rateLimit, { ipKeyGenerator } from "express-rate-limit";

function ipFallback(req: { ip?: string }): string {
  return ipKeyGenerator(req.ip ?? "");
}

export const sendCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Tente novamente mais tarde." },
  keyGenerator: (req) => {
    const phone = String(req.body?.telefone ?? "").replace(/\D/g, "");
    return phone ? `sms:${phone}` : `sms-ip:${ipFallback(req)}`;
  },
});

export const verifyCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de verificação" },
  keyGenerator: (req) => {
    const phone = String(req.body?.telefone ?? "").replace(/\D/g, "");
    return phone ? `verify:${phone}` : `verify-ip:${ipFallback(req)}`;
  },
});

export const passwordLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas de login" },
  keyGenerator: (req) => {
    const email = String(req.body?.email ?? "").toLowerCase().trim();
    const username = String(req.body?.username ?? "").toLowerCase().trim();
    const usuario = String(req.body?.usuario ?? "").toLowerCase().trim();
    const id = email || username || usuario;
    return id ? `pwd:${id}` : `pwd-ip:${ipFallback(req)}`;
  },
});

/** Tentativas de senha de chamada manual (monitor / coordenador / tablet). */
export const senhaManualAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Aguarde alguns minutos." },
  keyGenerator: (req) => {
    const sess = req.session as { tabletChamadaUserId?: number; userId?: number } | undefined;
    const tabletId = sess?.tabletChamadaUserId;
    const userId = (req as { user?: { id?: number | string } }).user?.id ?? sess?.userId;
    if (tabletId) return `senha-manual:tablet:${tabletId}`;
    if (userId) return `senha-manual:user:${userId}`;
    return `senha-manual-ip:${ipFallback(req)}`;
  },
});
