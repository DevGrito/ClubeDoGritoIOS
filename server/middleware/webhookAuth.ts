import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

const isProd = process.env.NODE_ENV === "production";

/** Token da catraca — aceita nome novo ou legado WEBHOOK_PRESENCA_SECRET. */
export function resolveCatracaWebhookToken(): string | undefined {
  return (
    process.env.CATRACA_WEBHOOK_TOKEN?.trim() ||
    process.env.WEBHOOK_PRESENCA_SECRET?.trim() ||
    undefined
  );
}

/** Token webhook Cielo — variável dedicada (≠ CIELO_MERCHANT_KEY). */
export function resolveCieloWebhookToken(): string | undefined {
  return process.env.CIELO_WEBHOOK_TOKEN?.trim() || undefined;
}

export function requireWebhookSecret(
  envName: string,
  getToken: (req: Request) => string | undefined,
  resolveExpected?: () => string | undefined
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const expected = resolveExpected?.() ?? process.env[envName]?.trim();
    if (!expected) {
      if (isProd) {
        console.error(`[WEBHOOK] ${envName} não configurado em produção`);
        return res.status(503).json({ error: "Webhook não configurado" });
      }
      console.warn(`[WEBHOOK] ${envName} ausente — aceito só em dev`);
      return next();
    }
    const received = getToken(req);
    if (!received || received !== expected) {
      return res.status(401).json({ error: "Webhook não autorizado" });
    }
    next();
  };
}

export function getCieloWebhookToken(req: Request): string | undefined {
  const fromHeader = req.header("x-cielo-webhook-token")?.trim();
  if (fromHeader) return fromHeader;
  const auth = req.header("authorization")?.trim() ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return undefined;
}

/** Token para catraca — aceita x-catraca-token e x-webhook-secret (UI dev-marketing). */
export function getCatracaWebhookToken(req: Request): string | undefined {
  const fromCatraca = req.header("x-catraca-token")?.trim();
  if (fromCatraca) return fromCatraca;
  const fromLegacy = req.header("x-webhook-secret")?.trim();
  if (fromLegacy) return fromLegacy;
  const auth = req.header("authorization")?.trim() ?? "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return undefined;
}

/** Headers para chamadas server→server ao webhook de presença. */
export function catracaWebhookHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = resolveCatracaWebhookToken();
  if (token) headers["x-catraca-token"] = token;
  return headers;
}

export function requireTypeformWebhook(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const secret = process.env.TYPEFORM_WEBHOOK_SECRET?.trim();
  if (!secret) {
    if (isProd) {
      console.error("[WEBHOOK] TYPEFORM_WEBHOOK_SECRET não configurado em produção");
      return res.status(503).json({ error: "Webhook não configurado" });
    }
    console.warn("[WEBHOOK] TYPEFORM_WEBHOOK_SECRET ausente — aceito só em dev");
    return next();
  }

  const signature = req.header("typeform-signature");
  if (!signature) {
    return res.status(401).json({ error: "Assinatura Typeform ausente" });
  }

  const rawBody = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {}), "utf8");

  const hash = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  const expected = `sha256=${hash}`;

  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return res.status(401).json({ error: "Assinatura Typeform inválida" });
    }
  } catch {
    return res.status(401).json({ error: "Assinatura Typeform inválida" });
  }

  next();
}

export function parseWebhookJsonBody(req: Request): unknown {
  if (Buffer.isBuffer(req.body)) {
    return JSON.parse(req.body.toString("utf8"));
  }
  if (typeof req.body === "string") {
    return JSON.parse(req.body);
  }
  return req.body;
}
