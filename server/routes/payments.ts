/**
 * Rotas de pagamento — Cielo eCommerce (cartão + PIX)
 *
 * POST   /api/payments/pix
 * POST   /api/payments/card
 * GET    /api/payments/:orderRef/status
 * GET    /api/payments/pix/:orderRef/qrcode
 * POST   /api/payments/webhook
 */

import type { Express, Request, Response } from "express";
import { pool } from "../db";
import { safeErrorPayload, toClientError } from "../lib/safeError";
import {
  createCardPayment,
  createPixPayment,
  queryPaymentStatus,
  detectBrand,
  mapCieloStatus,
  isSandbox,
  type PaymentStatus,
} from "../services/cieloService";

// ─── helpers ──────────────────────────────────────────────────────────────────
import { requireWebhookSecret, getCieloWebhookToken, resolveCieloWebhookToken } from "../middleware/webhookAuth";

function sanitize(str: unknown): string {
  return typeof str === "string" ? str.trim() : "";
}

function generateOrderRef(eventoId: number): string {
  return `EVT${eventoId}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function maskCpf(cpf: string): string {
  const c = cpf.replace(/\D/g, "");
  return c.length >= 11 ? `${c.slice(0, 3)}.***.***-${c.slice(-2)}` : "***";
}

async function assignTickets(
  eventoId: number,
  quantidade: number,
  orderRef: string,
  paymentId: string,
  metodo: "pix" | "cartao",
  titular: { nome: string; cpf: string; email: string; telefone: string },
  usuarioPortalId: number | null,
  valorUnit: number,
  parcelas: number
): Promise<{ id: number; codigo: string }[]> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT id, codigo FROM ingressos_portal WHERE evento_id=$1 AND status='disponivel' LIMIT $2 FOR UPDATE SKIP LOCKED`,
      [eventoId, quantidade]
    );

    if (rows.length < quantidade) {
      throw new Error(`Ingressos insuficientes: disponíveis ${rows.length}, solicitados ${quantidade}`);
    }

    const cpfRaw = titular.cpf.replace(/\D/g, "");

    // Verifica se o CPF do comprador já tem um ingresso (para ele mesmo) neste evento
    const { rows: jaTemIngresso } = await client.query(
      `SELECT id FROM ingressos_portal
       WHERE evento_id=$1 AND status != 'cancelado' AND para_terceiro = false
       AND titular_cpf = ANY($2::text[])`,
      [eventoId, [cpfRaw, titular.cpf]]
    );
    const titularJaTem = jaTemIngresso.length > 0;

    // Separa: o primeiro ingresso é para o comprador (se ele não tiver), o resto vai para terceiro pendente
    const idParaMim: number[] = [];
    const idsParaTerceiro: number[] = [];
    for (let i = 0; i < rows.length; i++) {
      if (!titularJaTem && i === 0) idParaMim.push(rows[i].id);
      else idsParaTerceiro.push(rows[i].id);
    }

    const baseParams = [usuarioPortalId, titular.nome, cpfRaw, titular.email, titular.telefone, metodo, paymentId, valorUnit, parcelas];

    if (idParaMim.length > 0) {
      await client.query(
        `UPDATE ingressos_portal SET
           status='resgatado', usuario_portal_id=$1,
           titular_nome=$2, titular_cpf=$3, titular_email=$4, titular_telefone=$5,
           para_terceiro=false,
           resgatado_em=NOW(), metodo_pagamento=$6, gateway='cielo_ecommerce',
           payment_id=$7, valor_pago=$8, parcelas=$9
         WHERE id = ANY($10::int[])`,
        [...baseParams, idParaMim]
      );
    }

    if (idsParaTerceiro.length > 0) {
      // Ingressos extras: portador pendente de definição pelo comprador
      await client.query(
        `UPDATE ingressos_portal SET
           status='resgatado', usuario_portal_id=$1,
           titular_nome=$2, titular_cpf=$3, titular_email=$4, titular_telefone=$5,
           para_terceiro=true,
           beneficiario_nome=null, beneficiario_cpf=null, beneficiario_email=null, beneficiario_telefone=null,
           resgatado_em=NOW(), metodo_pagamento=$6, gateway='cielo_ecommerce',
           payment_id=$7, valor_pago=$8, parcelas=$9
         WHERE id = ANY($10::int[])`,
        [...baseParams, idsParaTerceiro]
      );
    }

    await client.query("COMMIT");
    return rows.map((r: any) => ({ id: r.id, codigo: r.codigo }));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}


async function updateOrderStatus(
  orderRef: string,
  patch: {
    status: PaymentStatus;
    cieloPaymentId?: string;
    cieloStatus?: number;
    returnCode?: string;
    errorMessage?: string;
    pixQrCodeBase64?: string;
    pixQrCodeString?: string;
  }
): Promise<void> {
  await pool.query(
    `UPDATE event_payment_orders SET
       status=$1, cielo_payment_id=COALESCE($2, cielo_payment_id),
       cielo_status=COALESCE($3, cielo_status), return_code=COALESCE($4, return_code),
       error_message=COALESCE($5, error_message),
       pix_qr_code_base64=COALESCE($6, pix_qr_code_base64),
       pix_qr_code_string=COALESCE($7, pix_qr_code_string),
       atualizado_em=NOW()
     WHERE order_ref=$8`,
    [
      patch.status,
      patch.cieloPaymentId ?? null,
      patch.cieloStatus ?? null,
      patch.returnCode ?? null,
      patch.errorMessage ?? null,
      patch.pixQrCodeBase64 ?? null,
      patch.pixQrCodeString ?? null,
      orderRef,
    ]
  );
}

// ─── Garante que a tabela existe ──────────────────────────────────────────────

export async function ensurePaymentOrdersTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS event_payment_orders (
      id               SERIAL PRIMARY KEY,
      evento_id        INTEGER REFERENCES eventos_grito(id),
      usuario_portal_id INTEGER,
      order_ref        TEXT NOT NULL UNIQUE,
      idempotency_key  TEXT UNIQUE,
      metodo_pagamento TEXT NOT NULL,
      quantidade       INTEGER NOT NULL DEFAULT 1,
      valor_total      INTEGER NOT NULL,
      parcelas         INTEGER DEFAULT 1,
      status           TEXT NOT NULL DEFAULT 'created',
      cielo_payment_id TEXT,
      cielo_status     INTEGER,
      titular_nome     TEXT NOT NULL,
      titular_cpf      TEXT NOT NULL,
      titular_email    TEXT NOT NULL,
      titular_telefone TEXT NOT NULL,
      pix_qr_code_base64 TEXT,
      pix_qr_code_string TEXT,
      error_message    TEXT,
      return_code      TEXT,
      criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      atualizado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_epo_evento ON event_payment_orders(evento_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_epo_cielo_payment ON event_payment_orders(cielo_payment_id)`);
}

// ─── Registra todas as rotas ───────────────────────────────────────────────────

export function registerPaymentRoutes(app: Express): void {

  // ── POST /api/payments/pix ─────────────────────────────────────────────────
  app.post("/api/payments/pix", async (req: Request, res: Response) => {
    const sess = req.session as any;
    const usuarioPortalId: number | null = sess?.portalUserId ?? null;

    try {
      const eventoId = parseInt(sanitize(req.body.eventoId));
      const quantidade = Math.max(1, Math.min(10, parseInt(req.body.quantidade) || 1));
      const idempotencyKey = sanitize(req.body.idempotencyKey);
      const titular = {
        nome: sanitize(req.body.nome),
        cpf: sanitize(req.body.cpf),
        email: sanitize(req.body.email),
        telefone: sanitize(req.body.telefone),
      };

      if (!eventoId || !titular.nome || !titular.cpf || !titular.email || !titular.telefone) {
        return res.status(400).json({ error: "Dados obrigatórios ausentes" });
      }
      if (titular.cpf.replace(/\D/g, "").length !== 11) {
        return res.status(400).json({ error: "CPF inválido" });
      }
      if (!titular.email.includes("@")) {
        return res.status(400).json({ error: "E-mail inválido" });
      }

      // Idempotência: chave já processada?
      if (idempotencyKey) {
        const { rows: existing } = await pool.query(
          `SELECT order_ref, status, cielo_payment_id, pix_qr_code_base64, pix_qr_code_string
           FROM event_payment_orders WHERE idempotency_key=$1`,
          [idempotencyKey]
        );
        if (existing.length > 0) {
          const ord = existing[0];
          console.log(`[PAYMENTS] PIX - idempotência hit: ${ord.order_ref} status:${ord.status}`);
          if (ord.status === "paid") {
            return res.json({ sucesso: true, metodoPagamento: "pix", orderRef: ord.order_ref, status: "paid", jaProcessado: true });
          }
          if (["pending", "created"].includes(ord.status)) {
            return res.json({
              sucesso: true,
              metodoPagamento: "pix",
              orderRef: ord.order_ref,
              paymentId: ord.cielo_payment_id,
              qrCodeBase64: ord.pix_qr_code_base64,
              qrCodeString: ord.pix_qr_code_string,
              status: ord.status,
              sandbox: isSandbox(),
            });
          }
        }
      }

      // Validar evento
      const { rows: [evento] } = await pool.query(
        `SELECT id, titulo, preco, gratuito, status, capacidade FROM eventos_grito WHERE id=$1`,
        [eventoId]
      );
      if (!evento) return res.status(404).json({ error: "Evento não encontrado" });
      if (evento.gratuito || parseInt(evento.preco) === 0) {
        return res.status(400).json({ error: "Use o endpoint de resgate para eventos gratuitos" });
      }
      if (evento.status === "encerrado") {
        return res.status(400).json({ error: "Inscrições encerradas para este evento" });
      }

      const precoUnit = parseInt(evento.preco);
      const valorTotal = precoUnit * quantidade;
      const orderRef = generateOrderRef(eventoId);

      // Registrar pedido
      await pool.query(
        `INSERT INTO event_payment_orders
           (evento_id, usuario_portal_id, order_ref, idempotency_key, metodo_pagamento,
            quantidade, valor_total, parcelas, status, titular_nome, titular_cpf, titular_email, titular_telefone)
         VALUES ($1,$2,$3,$4,'pix',$5,$6,1,'created',$7,$8,$9,$10)`,
        [eventoId, usuarioPortalId, orderRef, idempotencyKey || null, quantidade, valorTotal,
          titular.nome, titular.cpf.replace(/\D/g, ""), titular.email, titular.telefone]
      );

      // Chamar Cielo
      let result;
      try {
        result = await createPixPayment({ orderRef, idempotencyKey, valorTotal, titular });
      } catch (err: any) {
        await updateOrderStatus(orderRef, { status: "error", errorMessage: err.message });
        return res.status(502).json(safeErrorPayload(err, "Erro ao processar PIX"));
      }

      await updateOrderStatus(orderRef, {
        status: result.status,
        cieloPaymentId: result.paymentId,
        cieloStatus: result.cieloStatus,
        pixQrCodeBase64: result.qrCodeBase64,
        pixQrCodeString: result.qrCodeString,
      });

      return res.json({
        sucesso: true,
        metodoPagamento: "pix",
        orderRef,
        paymentId: result.paymentId,
        qrCodeBase64: result.qrCodeBase64 ?? null,
        qrCodeString: result.qrCodeString ?? null,
        status: result.status,
        valorTotal,
        sandbox: isSandbox(),
      });
    } catch (e: any) {
      console.error("[PAYMENTS] Erro PIX:", e.message);
      return res.status(500).json({ error: "Erro interno ao processar PIX" });
    }
  });

  // ── POST /api/payments/card ────────────────────────────────────────────────
  app.post("/api/payments/card", async (req: Request, res: Response) => {
    const sess = req.session as any;
    const usuarioPortalId: number | null = sess?.portalUserId ?? null;

    try {
      const eventoId = parseInt(sanitize(req.body.eventoId));
      const quantidade = Math.max(1, Math.min(10, parseInt(req.body.quantidade) || 1));
      const parcelas = Math.max(1, Math.min(10, parseInt(req.body.parcelas) || 1));
      const idempotencyKey = sanitize(req.body.idempotencyKey);
      const titular = {
        nome: sanitize(req.body.nome),
        cpf: sanitize(req.body.cpf),
        email: sanitize(req.body.email),
        telefone: sanitize(req.body.telefone),
      };
      const cartaoNumero = sanitize(req.body.cardNumber).replace(/\D/g, "");
      const cartaoTitular = sanitize(req.body.cardName);
      const cartaoValidade = sanitize(req.body.cardExpiry);
      const cartaoCvv = sanitize(req.body.cardCvv);

      if (!eventoId || !titular.nome || !titular.cpf || !titular.email || !titular.telefone) {
        return res.status(400).json({ error: "Dados do comprador incompletos" });
      }
      if (!cartaoNumero || cartaoNumero.length < 13 || !cartaoTitular || !cartaoValidade || !cartaoCvv) {
        return res.status(400).json({ error: "Dados do cartão incompletos" });
      }
      if (titular.cpf.replace(/\D/g, "").length !== 11) {
        return res.status(400).json({ error: "CPF inválido" });
      }

      // Idempotência
      if (idempotencyKey) {
        const { rows: existing } = await pool.query(
          `SELECT order_ref, status, metodo_pagamento, cielo_payment_id FROM event_payment_orders WHERE idempotency_key=$1`,
          [idempotencyKey]
        );
        if (existing.length > 0) {
          const ord = existing[0];
          if (ord.status === "paid") {
            return res.json({ sucesso: true, metodoPagamento: "cartao", orderRef: ord.order_ref, status: "paid", jaProcessado: true });
          }
          if (ord.metodo_pagamento === "cartao") {
            return res.status(409).json({
              error: "Já existe uma tentativa de pagamento com cartão em andamento para este checkout.",
              orderRef: ord.order_ref,
              status: ord.status,
              jaProcessado: true,
            });
          }
          return res.status(409).json({
            error: "Este checkout já foi iniciado com PIX. Troque o método novamente para gerar uma nova tentativa.",
            orderRef: ord.order_ref,
            status: ord.status,
            metodoPagamento: ord.metodo_pagamento,
            paymentId: ord.cielo_payment_id,
          });
        }
      }

      // Validar evento
      const { rows: [evento] } = await pool.query(
        `SELECT id, titulo, preco, gratuito, status FROM eventos_grito WHERE id=$1`,
        [eventoId]
      );
      if (!evento) return res.status(404).json({ error: "Evento não encontrado" });
      if (evento.gratuito || parseInt(evento.preco) === 0) {
        return res.status(400).json({ error: "Evento gratuito não requer pagamento" });
      }

      const precoUnit = parseInt(evento.preco);
      const valorTotal = precoUnit * quantidade;
      const orderRef = generateOrderRef(eventoId);
      const bandeira = detectBrand(cartaoNumero);

      // Registrar pedido
      try {
        await pool.query(
          `INSERT INTO event_payment_orders
             (evento_id, usuario_portal_id, order_ref, idempotency_key, metodo_pagamento,
              quantidade, valor_total, parcelas, status, titular_nome, titular_cpf, titular_email, titular_telefone)
           VALUES ($1,$2,$3,$4,'cartao',$5,$6,$7,'processing',$8,$9,$10,$11)`,
          [eventoId, usuarioPortalId, orderRef, idempotencyKey || null, quantidade, valorTotal, parcelas,
            titular.nome, titular.cpf.replace(/\D/g, ""), titular.email, titular.telefone]
        );
      } catch (insertErr: any) {
        if (insertErr?.code === "23505" && idempotencyKey) {
          return res.status(409).json({
            error: "Tentativa duplicada detectada. Troque a forma de pagamento novamente e tente de novo.",
            idempotencyConflict: true,
          });
        }
        throw insertErr;
      }

      // Chamar Cielo — CVV nunca logado
      let result;
      try {
        result = await createCardPayment({
          orderRef,
          idempotencyKey,
          valorTotal,
          parcelas,
          titular,
          cartao: { numero: cartaoNumero, titular: cartaoTitular, validade: cartaoValidade, cvv: cartaoCvv, bandeira },
        });
      } catch (err: any) {
        await updateOrderStatus(orderRef, { status: "error", errorMessage: err.message });
        return res.status(502).json(safeErrorPayload(err, "Erro ao processar PIX"));
      }

      await updateOrderStatus(orderRef, {
        status: result.status,
        cieloPaymentId: result.paymentId,
        cieloStatus: result.cieloStatus,
        returnCode: result.returnCode,
        errorMessage: result.status !== "paid" ? result.returnMessage : undefined,
      });

      if (result.status !== "paid") {
        if (isGatewayConfigurationError(result.returnCode, result.returnMessage)) {
          return res.status(502).json({
            error: "Falha de configuração na Cielo (credenciais/ambiente). Verifique CIELO_ENV, CIELO_MERCHANT_ID e CIELO_MERCHANT_KEY.",
            returnCode: result.returnCode,
            status: result.status,
          });
        }
        const msg = friendlyDenialMessage(result.returnCode, result.returnMessage);
        return res.status(402).json({ error: msg, returnCode: result.returnCode, status: result.status });
      }

      // Atribuir ingressos atomicamente
      let ingressos: { id: number; codigo: string }[];
      try {
        ingressos = await assignTickets(
          eventoId, quantidade, orderRef, result.paymentId,
          "cartao", titular, usuarioPortalId, precoUnit, parcelas
        );
      } catch (err: any) {
        console.error(`[PAYMENTS] Pagamento aprovado mas falha ao atribuir ingressos: ${err.message} Ref:${orderRef}`);
        await updateOrderStatus(orderRef, { errorMessage: `Ingressos: ${err.message}` });
        return res.status(500).json({ error: "Pagamento aprovado mas houve erro ao gerar ingressos. Entre em contato." });
      }

      await updateOrderStatus(orderRef, { status: "paid" });

      return res.json({
        sucesso: true,
        metodoPagamento: "cartao",
        orderRef,
        paymentId: result.paymentId,
        status: "paid",
        ingressos,
        parcelas,
        valorTotal,
      });
    } catch (e: any) {
      console.error("[PAYMENTS] Erro cartão:", e.message);
      return res.status(500).json({ error: "Erro interno ao processar pagamento" });
    }
  });

  // ── GET /api/payments/:orderRef/status ─────────────────────────────────────
  app.get("/api/payments/:orderRef/status", async (req: Request, res: Response) => {
    try {
      const { orderRef } = req.params;

      const { rows: [order] } = await pool.query(
        `SELECT * FROM event_payment_orders WHERE order_ref=$1`,
        [orderRef]
      );
      if (!order) return res.status(404).json({ error: "Pedido não encontrado" });

      // PIX pendente: consultar Cielo e atualizar se necessário
      if (order.metodo_pagamento === "pix" && order.cielo_payment_id && order.status !== "paid") {
        let cieloResult;
        try {
          cieloResult = await queryPaymentStatus(order.cielo_payment_id);
        } catch (err: any) {
          return res.json({
            orderRef,
            status: order.status,
            pago: false,
            erro: toClientError(err, "Erro ao consultar pagamento"),
          });
        }

        if (cieloResult.status === "paid" && order.status !== "paid") {
          await updateOrderStatus(orderRef, {
            status: "paid",
            cieloStatus: cieloResult.cieloStatus,
          });

          // Atribuir ingressos
          const eventoId = order.evento_id;
          const precoUnit = Math.round(order.valor_total / order.quantidade);
          const titular = {
            nome: order.titular_nome,
            cpf: order.titular_cpf,
            email: order.titular_email,
            telefone: order.titular_telefone,
          };

          let ingressos: { id: number; codigo: string }[] = [];
          try {
            ingressos = await assignTickets(
              eventoId, order.quantidade, orderRef, order.cielo_payment_id,
              "pix", titular, order.usuario_portal_id, precoUnit, 1
            );
          } catch (err: any) {
            console.error(`[PAYMENTS] PIX confirmado mas falha ao atribuir ingressos: ${err.message} Ref:${orderRef}`);
          }

          return res.json({ orderRef, status: "paid", pago: true, ingressos });
        }

        if (cieloResult.status !== order.status) {
          await updateOrderStatus(orderRef, { status: cieloResult.status, cieloStatus: cieloResult.cieloStatus });
        }

        return res.json({ orderRef, status: cieloResult.status, pago: cieloResult.status === "paid" });
      }

      return res.json({
        orderRef,
        status: order.status,
        pago: order.status === "paid",
        metodoPagamento: order.metodo_pagamento,
        valorTotal: order.valor_total,
      });
    } catch (e: any) {
      console.error("[PAYMENTS] Erro status:", e.message);
      return res.status(500).json({ error: "Erro interno" });
    }
  });

  // ── GET /api/payments/pix/:orderRef/qrcode ─────────────────────────────────
  app.get("/api/payments/pix/:orderRef/qrcode", async (req: Request, res: Response) => {
    try {
      const { orderRef } = req.params;
      const { rows: [order] } = await pool.query(
        `SELECT pix_qr_code_base64, pix_qr_code_string, status, valor_total FROM event_payment_orders WHERE order_ref=$1`,
        [orderRef]
      );
      if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
      return res.json({
        qrCodeBase64: order.pix_qr_code_base64,
        qrCodeString: order.pix_qr_code_string,
        status: order.status,
        valorTotal: order.valor_total,
      });
    } catch (e: any) {
      return res.status(500).json({ error: "Erro interno" });
    }
  });

  // ── POST /api/payments/webhook ─────────────────────────────────────────────
  app.post(
    "/api/payments/webhook",
    requireWebhookSecret("CIELO_WEBHOOK_TOKEN", getCieloWebhookToken, resolveCieloWebhookToken),
    async (req: Request, res: Response) => {
    try {
      const body = req.body;
      const paymentId: string = body?.PaymentId ?? body?.payment?.id;
      const cieloStatus: number = body?.ChangeType ?? body?.Payment?.Status;

      if (!paymentId) {
        console.warn("[PAYMENTS] Webhook sem PaymentId");
        return res.status(400).json({ error: "PaymentId ausente" });
      }

      console.log(`[PAYMENTS] Webhook Cielo: PaymentId=${paymentId} ChangeType=${cieloStatus}`);

      // Buscar pedido pelo cielo_payment_id
      const { rows: [order] } = await pool.query(
        `SELECT * FROM event_payment_orders WHERE cielo_payment_id=$1`,
        [paymentId]
      );

      if (!order) {
        // Pode ser ingresso de outro módulo (SOP etc.) — ignorar silenciosamente
        return res.status(200).json({ ok: true });
      }

      if (order.status === "paid") {
        return res.status(200).json({ ok: true, msg: "Já processado" });
      }

      // Consultar status real na Cielo
      let cieloResult;
      try {
        cieloResult = await queryPaymentStatus(paymentId);
      } catch (err: any) {
        console.error(`[PAYMENTS] Webhook - falha ao consultar Cielo: ${err.message}`);
        return res.status(200).json({ ok: false });
      }

      await updateOrderStatus(order.order_ref, {
        status: cieloResult.status,
        cieloStatus: cieloResult.cieloStatus,
      });

      if (cieloResult.status === "paid") {
        const precoUnit = Math.round(order.valor_total / order.quantidade);
        const titular = {
          nome: order.titular_nome,
          cpf: order.titular_cpf,
          email: order.titular_email,
          telefone: order.titular_telefone,
        };
        try {
          await assignTickets(
            order.evento_id, order.quantidade, order.order_ref, paymentId,
            order.metodo_pagamento, titular, order.usuario_portal_id, precoUnit, order.parcelas
          );
          await updateOrderStatus(order.order_ref, { status: "paid" });
          console.log(`[PAYMENTS] Webhook: ingressos atribuídos Ref:${order.order_ref}`);
        } catch (err: any) {
          console.error(`[PAYMENTS] Webhook: falha ingressos Ref:${order.order_ref}: ${err.message}`);
        }
      }

      return res.status(200).json({ ok: true });
    } catch (e: any) {
      console.error("[PAYMENTS] Erro webhook:", e.message);
      return res.status(200).json({ ok: false });
    }
  });
}

// ─── mensagens amigáveis de recusa ────────────────────────────────────────────
function friendlyDenialMessage(returnCode?: string, returnMessage?: string): string {
  const code = returnCode ?? "";
  const messages: Record<string, string> = {
    "05": "Pagamento não autorizado. Verifique seu limite ou tente outro cartão.",
    "57": "Cartão expirado ou bloqueado.",
    "78": "Cartão bloqueado. Entre em contato com seu banco.",
    "99": "Transação não processada. Tente novamente.",
    "51": "Limite insuficiente no cartão.",
    "14": "Número do cartão inválido.",
    "54": "Cartão expirado.",
  };
  return messages[code] ?? (returnMessage ? `Pagamento recusado: ${returnMessage}` : "Pagamento não autorizado. Tente outro cartão.");
}

function isGatewayConfigurationError(returnCode?: string, returnMessage?: string): boolean {
  const code = (returnCode ?? "").trim();
  const msg = (returnMessage ?? "").toLowerCase();
  if (code === "002") return true;
  return msg.includes("credencial") || msg.includes("merchant") || msg.includes("chave");
}
