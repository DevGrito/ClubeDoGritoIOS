// server/health.ts
import type { Request, Response, Router } from "express";
import express from "express";
import { pool } from "./db";

export function healthRouter(): Router {
  const r = express.Router();

  // responde em /health
  r.get("/health", async (_req: Request, res: Response) => {
    try {
      const start = Date.now();
      await pool.query("SELECT 1");
      const dbMs = Date.now() - start;

      res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        checks: {
          db: { ok: true, latency_ms: dbMs },
        },
      });
    } catch (err) {
      res.status(500).json({
        status: "fail",
        error: (err as Error)?.message ?? String(err),
      });
    }
  });

  // compat com o proxy do nginx (se não remover /api)
  r.get("/api/health", (_req: Request, res: Response) => res.redirect(307, "/health"));

  // HEAD também (healthchecks às vezes usam HEAD)
  r.head("/health", (_req: Request, res: Response) => res.status(200).end());
  r.head("/api/health", (_req: Request, res: Response) => res.status(200).end());

  return r;
}