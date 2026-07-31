import type { Express, Request, Response, NextFunction } from "express";
import type { Pool } from "pg";
import { normalizeCpfDigits } from "@shared/cpf";
import {
  createObservacao,
  deleteObservacao,
  fetchHistoricoByCpf,
  fetchObservacoesByCpf,
  resolveAutorSetor,
} from "../services/atendidosGritoHistorico";
import {
  getUserRoleFromRequest,
  hasPsicoFullProfileAccess,
} from "../psicoAtendidoPerfil";
import {
  queryAtendidosGritoStats,
  runAtendidosGritoBackfill,
} from "../services/atendidosGritoBackfill";
import { getNextCpfProvisorio, getAtendidoGritoByCpf } from "../services/atendidosGritoSync";
import { getAtendidosGritoWriteFlags } from "../services/atendidosGritoFlags";

type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => void;
type RoleMiddleware = (roles: string[]) => AuthMiddleware;

export const ATENDIDOS_GRITO_STAFF_ROLES = [
  "coordenador",
  "coordenador_pec",
  "coordenador_inclusao",
  "coordenador_psico",
  "monitor",
  "monitor_pec",
  "monitor_inclusao",
  "monitor_psico",
  "professor",
  "professor_pec",
  "professor_inclusao",
  "tecnica_psico",
  "admin",
  "leo",
  "dev",
  "super_admin",
];

const ATENDIDOS_GRITO_ADMIN_ROLES = ["admin", "leo", "dev", "super_admin", "dev-admin"];

function resolveAutorUserId(req: Request): number | null {
  const user = req.user as Record<string, unknown> | undefined;
  const raw = user?.id;
  if (typeof raw === "number" && raw > 0) return raw;
  if (typeof raw === "string" && /^\d+$/.test(raw)) return parseInt(raw, 10);
  return null;
}

function resolveAutorNome(req: Request): string {
  const user = req.user as Record<string, unknown> | undefined;
  const nome = user?.nome || user?.userName || user?.name || "";
  return String(nome).trim() || "Usuário";
}

export function registerAtendidosGritoRoutes(
  app: Express,
  deps: {
    pool: Pool;
    requireAuth: AuthMiddleware;
    requireAnyRole: RoleMiddleware;
  }
) {
  const { pool, requireAuth, requireAnyRole } = deps;
  const staffGuard = requireAnyRole(ATENDIDOS_GRITO_STAFF_ROLES);

  app.get(
    "/api/atendidos-grito/historico",
    requireAuth,
    staffGuard,
    async (req, res) => {
      try {
        const cpf = normalizeCpfDigits(req.query.cpf);
        if (cpf.length !== 11) {
          return res.status(400).json({ error: "CPF inválido" });
        }

        const role = getUserRoleFromRequest(req.user);
        const historico = await fetchHistoricoByCpf(pool, cpf, {
          psicoFullAccess: hasPsicoFullProfileAccess(role),
        });

        if (!historico) {
          return res.status(400).json({ error: "CPF inválido" });
        }

        return res.json(historico);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erro interno";
        console.error("GET /api/atendidos-grito/historico:", error);
        return res.status(500).json({ error: message });
      }
    }
  );

  app.get(
    "/api/atendidos-grito/observacoes",
    requireAuth,
    staffGuard,
    async (req, res) => {
      try {
        const cpf = normalizeCpfDigits(req.query.cpf);
        if (cpf.length !== 11) {
          return res.status(400).json({ error: "CPF inválido" });
        }
        const observacoes = await fetchObservacoesByCpf(pool, cpf);
        return res.json({ observacoes });
      } catch (error: unknown) {
        console.error("GET /api/atendidos-grito/observacoes:", error);
        return res.status(500).json({ error: "Erro interno" });
      }
    }
  );

  app.post(
    "/api/atendidos-grito/observacoes",
    requireAuth,
    staffGuard,
    async (req, res) => {
      try {
        const cpf = normalizeCpfDigits(req.body?.cpf);
        const texto = String(req.body?.texto || "").trim();
        if (cpf.length !== 11) {
          return res.status(400).json({ error: "CPF inválido" });
        }
        if (!texto) {
          return res.status(400).json({ error: "Texto obrigatório" });
        }

        const role = getUserRoleFromRequest(req.user);
        const observacao = await createObservacao(pool, {
          cpf,
          texto,
          autorNome: resolveAutorNome(req),
          autorSetor: resolveAutorSetor(role),
          autorUserId: resolveAutorUserId(req),
        });

        return res.status(201).json(observacao);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erro interno";
        console.error("POST /api/atendidos-grito/observacoes:", error);
        return res.status(500).json({ error: message });
      }
    }
  );

  app.delete(
    "/api/atendidos-grito/observacoes/:id",
    requireAuth,
    staffGuard,
    async (req, res) => {
      try {
        const id = parseInt(String(req.params.id), 10);
        if (!id) {
          return res.status(400).json({ error: "ID inválido" });
        }

        const authorUserId = resolveAutorUserId(req);
        const deleted = await deleteObservacao(pool, id, authorUserId);
        if (!deleted) {
          return res.status(403).json({
            error: "Só é possível apagar observações criadas por você",
          });
        }

        return res.json({ success: true });
      } catch (error: unknown) {
        console.error("DELETE /api/atendidos-grito/observacoes/:id:", error);
        return res.status(500).json({ error: "Erro interno" });
      }
    }
  );

  const adminGuard = requireAnyRole(ATENDIDOS_GRITO_ADMIN_ROLES);

  app.get(
    "/api/atendidos-grito/next-cpf-provisorio",
    requireAuth,
    staffGuard,
    async (_req, res) => {
      try {
        const cpf = await getNextCpfProvisorio();
        return res.json({ cpf });
      } catch (error: unknown) {
        console.error("GET /api/atendidos-grito/next-cpf-provisorio:", error);
        return res.status(500).json({ error: "Erro ao gerar CPF provisório" });
      }
    }
  );

  app.get(
    "/api/atendidos-grito/cadastro",
    requireAuth,
    staffGuard,
    async (req, res) => {
      try {
        const cpf = normalizeCpfDigits(req.query.cpf);
        if (cpf.length !== 11) {
          return res.status(400).json({ error: "CPF inválido" });
        }
        const cadastro = await getAtendidoGritoByCpf(cpf);
        if (!cadastro) {
          return res.status(404).json({ error: "Cadastro não encontrado" });
        }
        return res.json(cadastro);
      } catch (error: unknown) {
        console.error("GET /api/atendidos-grito/cadastro:", error);
        return res.status(500).json({ error: "Erro ao buscar cadastro" });
      }
    }
  );

  app.get(
    "/api/atendidos-grito/stats",
    requireAuth,
    adminGuard,
    async (_req, res) => {
      try {
        const stats = await queryAtendidosGritoStats(pool);
        return res.json({
          stats,
          writeFlags: getAtendidosGritoWriteFlags(),
          generatedAt: new Date().toISOString(),
        });
      } catch (error: unknown) {
        console.error("GET /api/atendidos-grito/stats:", error);
        return res.status(500).json({ error: "Erro ao carregar estatísticas" });
      }
    }
  );

  app.get(
    "/api/atendidos-grito/write-flags",
    requireAuth,
    staffGuard,
    async (_req, res) => {
      return res.json(getAtendidosGritoWriteFlags());
    }
  );

  app.get(
    "/api/atendidos-grito/backfill/preview",
    requireAuth,
    adminGuard,
    async (_req, res) => {
      try {
        const preview = await runAtendidosGritoBackfill(pool, { dryRun: true });
        return res.json(preview);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erro interno";
        console.error("GET /api/atendidos-grito/backfill/preview:", error);
        return res.status(500).json({ error: message });
      }
    }
  );

  app.post(
    "/api/atendidos-grito/backfill",
    requireAuth,
    adminGuard,
    async (req, res) => {
      try {
        const execute = req.body?.execute === true || req.query.execute === "true";
        if (!execute) {
          return res.status(400).json({
            error: "Envie execute=true para rodar o backfill (operação de escrita)",
          });
        }
        const result = await runAtendidosGritoBackfill(pool, { dryRun: false });
        const stats = await queryAtendidosGritoStats(pool);
        return res.json({ result, stats });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Erro interno";
        console.error("POST /api/atendidos-grito/backfill:", error);
        return res.status(500).json({ error: message });
      }
    }
  );
}
