import express, { type Request, type Response, type NextFunction } from "express";

/** Limite padrão para APIs JSON (SEC-022). */
export const DEFAULT_BODY_LIMIT = "2mb";

/** Limite maior só para rotas de importação/upload pesado. */
export const LARGE_BODY_LIMIT = "50mb";

const LARGE_BODY_PREFIXES = [
  "/api/pec/import",
];

export function bodyLimitForUrl(url: string): string {
  return LARGE_BODY_PREFIXES.some((p) => url.startsWith(p))
    ? LARGE_BODY_LIMIT
    : DEFAULT_BODY_LIMIT;
}

export function conditionalJsonParser() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (
      req.originalUrl.startsWith("/api/webhook/stripe") ||
      req.originalUrl.startsWith("/api/stripe/webhook") ||
      req.originalUrl.startsWith("/api/typeform/webhook")
    ) {
      return next();
    }
    return express.json({ limit: bodyLimitForUrl(req.originalUrl) })(req, res, next);
  };
}

export function conditionalUrlencodedParser() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (
      req.originalUrl.startsWith("/api/webhook/stripe") ||
      req.originalUrl.startsWith("/api/stripe/webhook") ||
      req.originalUrl.startsWith("/api/typeform/webhook")
    ) {
      return next();
    }
    return express.urlencoded({
      extended: false,
      limit: bodyLimitForUrl(req.originalUrl),
    })(req, res, next);
  };
}
