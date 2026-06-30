import type { Express, Request, Response, NextFunction } from "express";

const MONDAY_API = "https://api.monday.com/v2";

type AuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

/**
 * Proxy GraphQL para Monday.com — token apenas no servidor (SEC-002).
 */
export function registerMondayRoutes(
  app: Express,
  requireAuth: AuthMiddleware,
  requireRole: (roles: string[]) => AuthMiddleware
) {
  const guard = [
    requireAuth,
    requireRole([
      "dev",
      "desenvolvedor",
      "dev-admin",
      "dev-marketing",
      "admin",
      "leo",
      "super_admin",
    ]),
  ];

  app.post("/api/monday/graphql", ...guard, async (req: Request, res: Response) => {
    const token =
      process.env.MONDAY_TOKEN?.trim() || process.env.MONDAY_API_KEY?.trim();

    if (!token) {
      return res.status(503).json({
        error: "Monday.com não configurado",
        message: "Defina MONDAY_TOKEN ou MONDAY_API_KEY no servidor",
      });
    }

    const { query, variables, operationName } = req.body ?? {};
    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Campo query é obrigatório" });
    }

    if (query.length > 50_000) {
      return res.status(400).json({ error: "Query excede tamanho máximo" });
    }

    try {
      const response = await fetch(MONDAY_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
          "API-Version": "2023-10",
        },
        body: JSON.stringify({
          query,
          variables: variables ?? {},
          operationName,
        }),
      });

      const payload = await response.json();
      return res.status(response.ok ? 200 : response.status).json(payload);
    } catch (error) {
      console.error("[Monday proxy] Erro:", error);
      return res.status(502).json({ error: "Falha ao contactar Monday.com" });
    }
  });
}
