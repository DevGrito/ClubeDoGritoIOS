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
  isSandbox,
  type PaymentStatus,
} from "../services/cieloService";
import { requireWebhookSecret, getCieloWebhookToken, resolveCieloWebhookToken } from "../middleware/webhookAuth";
import { requireEventosPortalAuth } from "../middleware/portalAuth";
import {
  PIX_RESERVATION_MINUTES,
  CARD_RESERVATION_MINUTES,
  sanitize,
  generateOrderRef,
  parseQuantidade,
  decideExpiredOrderAction,
  assertOrderOwnedByPortalUser,
} from "./paymentHelpers";

async function releaseReservation(orderRef: string): Promise<void> {
  await pool.query(
    `UPDATE ingressos_portal SET
       status='disponivel', order_ref=NULL, reserved_until=NULL,
       usuario_portal_id=NULL, titular_nome=NULL, titular_cpf=NULL,
       titular_email=NULL, titular_telefone=NULL
     WHERE order_ref=$1 AND status='reservado'`,
    [orderRef]
  );
}

async function updateOrderStatus(
  orderRef: string,
  patch: {
    status: PaymentStatus | "reserved" | "fulfilling" | "fulfilled" | "expired";
    cieloPaymentId?: string;
    cieloStatus?: number;
    returnCode?: string;
    errorMessage?: string;
    pixQrCodeBase64?: string;
    pixQrCodeString?: string;
    reservedUntil?: Date | null;
  }
): Promise<void> {
  await pool.query(
    `UPDATE event_payment_orders SET
       status=$1, cielo_payment_id=COALESCE($2, cielo_payment_id),
       cielo_status=COALESCE($3, cielo_status), return_code=COALESCE($4, return_code),
       error_message=COALESCE($5, error_message),
       pix_qr_code_base64=COALESCE($6, pix_qr_code_base64),
       pix_qr_code_string=COALESCE($7, pix_qr_code_string),
       reserved_until=COALESCE($8, reserved_until),
       atualizado_em=NOW()
     WHERE order_ref=$9`,
    [
      patch.status,
      patch.cieloPaymentId ?? null,
      patch.cieloStatus ?? null,
      patch.returnCode ?? null,
      patch.errorMessage ?? null,
      patch.pixQrCodeBase64 ?? null,
      patch.pixQrCodeString ?? null,
      patch.reservedUntil ?? null,
      orderRef,
    ]
  );
}

async function fulfillReservedTickets(
  orderRef: string,
  paymentId: string,
  metodo: "pix" | "cartao",
  valorUnit: number,
  parcelas: number
): Promise<{ id: number; codigo: string }[]> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: [order] } = await client.query(
      `SELECT * FROM event_payment_orders WHERE order_ref=$1 FOR UPDATE`,
      [orderRef]
    );
    if (!order) throw new Error("Pedido não encontrado");

    if (order.status === "fulfilled") {
      const { rows } = await client.query(
        `SELECT id, codigo FROM ingressos_portal WHERE order_ref=$1 AND status IN ('resgatado','usado')`,
        [orderRef]
      );
      await client.query("COMMIT");
      return rows.map((r: any) => ({ id: r.id, codigo: r.codigo }));
    }

    const { rows: claimed } = await client.query(
      `UPDATE event_payment_orders SET status='fulfilling', atualizado_em=NOW()
       WHERE order_ref=$1 AND status IN ('reserved','pending','processing','paid','fulfilling')
       RETURNING *`,
      [orderRef]
    );
    if (claimed.length === 0) {
      throw new Error(`Pedido em estado inválido para fulfillment: ${order.status}`);
    }

    const { rows: reserved } = await client.query(
      `SELECT id, codigo FROM ingressos_portal
       WHERE order_ref=$1 AND status='reservado'
       ORDER BY id ASC
       FOR UPDATE`,
      [orderRef]
    );

    if (reserved.length < order.quantidade) {
      throw new Error(
        `Reserva incompleta: ${reserved.length}/${order.quantidade} para ${orderRef}`
      );
    }

    const cpfRaw = String(order.titular_cpf || "").replace(/\D/g, "");
    const { rows: jaTemIngresso } = await client.query(
      `SELECT id FROM ingressos_portal
       WHERE evento_id=$1 AND status NOT IN ('cancelado','disponivel','reservado')
         AND para_terceiro = false
         AND (
           usuario_portal_id=$2
           OR REPLACE(REPLACE(REPLACE(COALESCE(titular_cpf,''),'.',''),'-',''),' ','')=$3
         )
         AND order_ref IS DISTINCT FROM $4
       LIMIT 1`,
      [order.evento_id, order.usuario_portal_id, cpfRaw, orderRef]
    );
    const titularJaTem = jaTemIngresso.length > 0;

    const idParaMim: number[] = [];
    const idsParaTerceiro: number[] = [];
    for (let i = 0; i < reserved.length; i++) {
      if (!titularJaTem && i === 0) idParaMim.push(reserved[i].id);
      else idsParaTerceiro.push(reserved[i].id);
    }

    const baseParams = [
      order.usuario_portal_id,
      order.titular_nome,
      cpfRaw,
      order.titular_email,
      order.titular_telefone,
      metodo,
      paymentId,
      valorUnit,
      parcelas,
    ];

    if (idParaMim.length > 0) {
      await client.query(
        `UPDATE ingressos_portal SET
           status='resgatado',
           para_terceiro=false,
           resgatado_em=NOW(), metodo_pagamento=$6, gateway='cielo_ecommerce',
           payment_id=$7, valor_pago=$8, parcelas=$9,
           reserved_until=NULL
         WHERE id = ANY($10::int[]) AND status='reservado'`,
        [...baseParams, idParaMim]
      );
    }

    if (idsParaTerceiro.length > 0) {
      await client.query(
        `UPDATE ingressos_portal SET
           status='resgatado',
           para_terceiro=true,
           beneficiario_nome=null, beneficiario_cpf=null, beneficiario_email=null, beneficiario_telefone=null,
           resgatado_em=NOW(), metodo_pagamento=$6, gateway='cielo_ecommerce',
           payment_id=$7, valor_pago=$8, parcelas=$9,
           reserved_until=NULL
         WHERE id = ANY($10::int[]) AND status='reservado'`,
        [...baseParams, idsParaTerceiro]
      );
    }

    await client.query(
      `UPDATE event_payment_orders SET
         status='fulfilled', fulfilled_em=NOW(), atualizado_em=NOW()
       WHERE order_ref=$1`,
      [orderRef]
    );

    await client.query("COMMIT");
    return reserved.map((r: any) => ({ id: r.id, codigo: r.codigo }));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Reconcilia pedidos com reserved_until vencido:
 * consulta Cielo e só libera estoque se não houver pagamento confirmado.
 */
export async function reconcileExpiredOrders(eventoId?: number): Promise<void> {
  const params: any[] = [];
  let where = `
    status IN ('created','reserved','pending','processing','paid')
    AND reserved_until IS NOT NULL
    AND reserved_until < NOW()
  `;
  if (eventoId) {
    params.push(eventoId);
    where += ` AND evento_id=$${params.length}`;
  }

  const { rows: candidates } = await pool.query(
    `SELECT order_ref FROM event_payment_orders WHERE ${where} ORDER BY reserved_until ASC LIMIT 50`,
    params
  );

  for (const row of candidates) {
    await reconcileOneExpiredOrder(row.order_ref);
  }
}

async function reconcileOneExpiredOrder(orderRef: string): Promise<void> {
  const client = await pool.connect();
  let order: any;
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT * FROM event_payment_orders WHERE order_ref=$1 FOR UPDATE`,
      [orderRef]
    );
    order = rows[0];
    if (!order) {
      await client.query("ROLLBACK");
      return;
    }
    await client.query("COMMIT");
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    throw e;
  } finally {
    client.release();
  }

  if (!order) return;
  if (order.status === "fulfilled") return;

  let cieloStatus: string | null = null;
  let cieloPaymentId = order.cielo_payment_id || null;
  let cieloStatusCode: number | undefined;

  if (cieloPaymentId) {
    try {
      const cieloResult = await queryPaymentStatus(cieloPaymentId);
      cieloStatus = cieloResult.status;
      cieloStatusCode = cieloResult.cieloStatus;
    } catch (err: any) {
      console.warn(`[PAYMENTS] Reconcile: falha Cielo Ref:${orderRef}: ${err.message}`);
      // Sem confirmação, respeita a margem de graça via decideExpiredOrderAction
    }
  }

  const decision = decideExpiredOrderAction({
    now: Date.now(),
    reservedUntil: order.reserved_until ? new Date(order.reserved_until).getTime() : null,
    orderStatus: order.status,
    cieloStatus,
    cieloPaymentId,
  });

  if (decision.action === "wait" || decision.action === "keep_pending") {
    if (cieloStatus && cieloStatusCode != null && cieloStatus !== order.status) {
      await updateOrderStatus(orderRef, { status: cieloStatus as PaymentStatus, cieloStatus: cieloStatusCode });
    }
    return;
  }

  if (decision.action === "fulfill") {
    await updateOrderStatus(orderRef, {
      status: "paid",
      cieloStatus: cieloStatusCode,
    });
    const precoUnit = Math.round(order.valor_total / Math.max(1, order.quantidade));
    try {
      await fulfillReservedTickets(
        orderRef,
        decision.paymentId,
        order.metodo_pagamento === "cartao" ? "cartao" : "pix",
        precoUnit,
        order.parcelas || 1
      );
    } catch (err: any) {
      console.error(`[PAYMENTS] Reconcile fulfill falhou Ref:${orderRef}: ${err.message}`);
    }
    return;
  }

  // release
  await releaseReservation(orderRef);
  await updateOrderStatus(orderRef, {
    status: decision.status as any,
    cieloStatus: cieloStatusCode,
    errorMessage: decision.status === "expired" ? "Reserva expirada após reconciliação" : undefined,
  });
}

async function reserveTickets(
  eventoId: number,
  quantidade: number,
  orderRef: string,
  usuarioPortalId: number,
  titular: { nome: string; cpf: string; email: string; telefone: string },
  minutes: number
): Promise<{ id: number; codigo: string }[]> {
  await reconcileExpiredOrders(eventoId);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT id, codigo FROM ingressos_portal
       WHERE evento_id=$1 AND status='disponivel'
       ORDER BY id ASC
       LIMIT $2
       FOR UPDATE SKIP LOCKED`,
      [eventoId, quantidade]
    );
    if (rows.length < quantidade) {
      throw new Error(`Ingressos insuficientes: disponíveis ${rows.length}, solicitados ${quantidade}`);
    }

    const cpfRaw = titular.cpf.replace(/\D/g, "");
    const ids = rows.map((r: { id: number }) => r.id);
    await client.query(
      `UPDATE ingressos_portal SET
         status='reservado',
         order_ref=$1,
         reserved_until=NOW() + ($2::text || ' minutes')::interval,
         usuario_portal_id=$3,
         titular_nome=$4,
         titular_cpf=$5,
         titular_email=$6,
         titular_telefone=$7
       WHERE id = ANY($8::int[]) AND status='disponivel'`,
      [orderRef, String(minutes), usuarioPortalId, titular.nome, cpfRaw, titular.email, titular.telefone, ids]
    );

    const { rows: locked } = await client.query(
      `SELECT id, codigo FROM ingressos_portal WHERE order_ref=$1 AND status='reservado'`,
      [orderRef]
    );
    if (locked.length < quantidade) {
      throw new Error("Falha ao reservar ingressos");
    }

    await client.query("COMMIT");
    return locked.map((r: any) => ({ id: r.id, codigo: r.codigo }));
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function loadPortalTitular(usuarioPortalId: number) {
  const { rows: [usuario] } = await pool.query(
    `SELECT id, nome, cpf, email FROM usuarios_portal WHERE id=$1`,
    [usuarioPortalId]
  );
  return usuario || null;
}

export async function ensurePaymentOrdersTable(): Promise<void> {
  try {
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
        reserved_until   TIMESTAMPTZ,
        fulfilled_em     TIMESTAMPTZ,
        criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        atualizado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`ALTER TABLE event_payment_orders ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMPTZ`);
    await pool.query(`ALTER TABLE event_payment_orders ADD COLUMN IF NOT EXISTS fulfilled_em TIMESTAMPTZ`);

    await pool.query(`ALTER TABLE ingressos_portal ADD COLUMN IF NOT EXISTS order_ref TEXT`);
    await pool.query(`ALTER TABLE ingressos_portal ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMPTZ`);
    await pool.query(`ALTER TABLE ingressos_portal ADD COLUMN IF NOT EXISTS metodo_pagamento TEXT`);
    await pool.query(`ALTER TABLE ingressos_portal ADD COLUMN IF NOT EXISTS gateway TEXT`);
    await pool.query(`ALTER TABLE ingressos_portal ADD COLUMN IF NOT EXISTS payment_id TEXT`);
    await pool.query(`ALTER TABLE ingressos_portal ADD COLUMN IF NOT EXISTS valor_pago INTEGER`);
    await pool.query(`ALTER TABLE ingressos_portal ADD COLUMN IF NOT EXISTS parcelas INTEGER`);
    await pool.query(`ALTER TABLE ingressos_portal ADD COLUMN IF NOT EXISTS beneficiario_nascimento DATE`);
    await pool.query(`ALTER TABLE ingressos_portal ADD COLUMN IF NOT EXISTS beneficiario_genero TEXT`);
    await pool.query(`ALTER TABLE ingressos_portal ADD COLUMN IF NOT EXISTS beneficiario_logradouro TEXT`);
    await pool.query(`ALTER TABLE ingressos_portal ADD COLUMN IF NOT EXISTS beneficiario_numero TEXT`);
    await pool.query(`ALTER TABLE ingressos_portal ADD COLUMN IF NOT EXISTS beneficiario_bairro TEXT`);
    await pool.query(`ALTER TABLE ingressos_portal ADD COLUMN IF NOT EXISTS beneficiario_cidade TEXT`);
    await pool.query(`ALTER TABLE ingressos_portal ADD COLUMN IF NOT EXISTS beneficiario_estado TEXT`);
    await pool.query(`ALTER TABLE ingressos_portal ADD COLUMN IF NOT EXISTS beneficiario_cep TEXT`);

    await pool.query(`CREATE INDEX IF NOT EXISTS idx_epo_evento ON event_payment_orders(evento_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_epo_cielo_payment ON event_payment_orders(cielo_payment_id)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_epo_reserved_until ON event_payment_orders(reserved_until)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_ingressos_portal_order_ref ON ingressos_portal(order_ref)`);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_ingressos_portal_reservado_expira
      ON ingressos_portal(status, reserved_until)
      WHERE status = 'reservado'
    `);

    const { rows: orderCols } = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'event_payment_orders'
        AND column_name IN ('reserved_until', 'fulfilled_em', 'order_ref', 'status')
    `);
    const orderNames = new Set(orderCols.map((r: any) => r.column_name));
    for (const col of ["reserved_until", "fulfilled_em", "order_ref", "status"]) {
      if (!orderNames.has(col)) {
        throw new Error(`Schema event_payment_orders incompleto: falta coluna ${col}`);
      }
    }

    const { rows: ticketCols } = await pool.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'ingressos_portal'
        AND column_name IN ('order_ref', 'reserved_until', 'status')
    `);
    const ticketNames = new Set(ticketCols.map((r: any) => r.column_name));
    for (const col of ["order_ref", "reserved_until", "status"]) {
      if (!ticketNames.has(col)) {
        throw new Error(`Schema ingressos_portal incompleto: falta coluna ${col}`);
      }
    }

    console.log("✅ [PAYMENTS] Schema de reservas/pedidos validado");
  } catch (err: any) {
    console.error("FATAL [PAYMENTS]: falha ao preparar schema de reservas:", err?.message || err);
    throw err;
  }
}

export function registerPaymentRoutes(app: Express): void {
  app.post("/api/payments/pix", requireEventosPortalAuth, async (req: Request, res: Response) => {
    const usuarioPortalId = (req as Request & { portalUserId: number }).portalUserId;

    try {
      const eventoId = parseInt(sanitize(req.body.eventoId), 10);
      const quantidade = parseQuantidade(req.body.quantidade);
      const idempotencyKey = sanitize(req.body.idempotencyKey);
      const telefone = sanitize(req.body.telefone);

      if (!eventoId || !quantidade) {
        return res.status(400).json({ error: "Dados obrigatórios ausentes ou quantidade inválida" });
      }
      if (telefone.replace(/\D/g, "").length < 10) {
        return res.status(400).json({ error: "Telefone inválido" });
      }

      const usuario = await loadPortalTitular(usuarioPortalId);
      if (!usuario) return res.status(401).json({ error: "Usuário não encontrado" });

      const titular = {
        nome: usuario.nome,
        cpf: String(usuario.cpf || "").replace(/\D/g, ""),
        email: usuario.email,
        telefone,
      };
      if (titular.cpf.length !== 11 || !titular.email?.includes("@")) {
        return res.status(400).json({ error: "Cadastro incompleto: CPF e e-mail obrigatórios" });
      }

      if (idempotencyKey) {
        const { rows: existing } = await pool.query(
          `SELECT order_ref, status, cielo_payment_id, pix_qr_code_base64, pix_qr_code_string, reserved_until
           FROM event_payment_orders WHERE idempotency_key=$1`,
          [idempotencyKey]
        );
        if (existing.length > 0) {
          const ord = existing[0];
          if (ord.status === "fulfilled" || ord.status === "paid") {
            return res.json({ sucesso: true, metodoPagamento: "pix", orderRef: ord.order_ref, status: ord.status, jaProcessado: true });
          }
          if (["reserved", "pending", "created"].includes(ord.status)) {
            return res.json({
              sucesso: true,
              metodoPagamento: "pix",
              orderRef: ord.order_ref,
              paymentId: ord.cielo_payment_id,
              qrCodeBase64: ord.pix_qr_code_base64,
              qrCodeString: ord.pix_qr_code_string,
              status: ord.status,
              reservedUntil: ord.reserved_until,
              sandbox: isSandbox(),
            });
          }
        }
      }

      await reconcileExpiredOrders(eventoId);

      const { rows: [evento] } = await pool.query(
        `SELECT id, titulo, preco, gratuito, status, capacidade FROM eventos_grito WHERE id=$1`,
        [eventoId]
      );
      if (!evento) return res.status(404).json({ error: "Evento não encontrado" });
      if (evento.gratuito || parseInt(evento.preco) === 0) {
        return res.status(400).json({ error: "Use o endpoint de resgate para eventos gratuitos" });
      }
      if (evento.status !== "disponivel") {
        return res.status(400).json({ error: "Evento não disponível para compra" });
      }

      const precoUnit = parseInt(evento.preco);
      const valorTotal = precoUnit * quantidade;
      const orderRef = generateOrderRef(eventoId);
      const reservedUntil = new Date(Date.now() + PIX_RESERVATION_MINUTES * 60 * 1000);

      await pool.query(
        `INSERT INTO event_payment_orders
           (evento_id, usuario_portal_id, order_ref, idempotency_key, metodo_pagamento,
            quantidade, valor_total, parcelas, status, titular_nome, titular_cpf, titular_email, titular_telefone, reserved_until)
         VALUES ($1,$2,$3,$4,'pix',$5,$6,1,'created',$7,$8,$9,$10,$11)`,
        [eventoId, usuarioPortalId, orderRef, idempotencyKey || null, quantidade, valorTotal,
          titular.nome, titular.cpf, titular.email, titular.telefone, reservedUntil]
      );

      try {
        await reserveTickets(eventoId, quantidade, orderRef, usuarioPortalId, titular, PIX_RESERVATION_MINUTES);
        await updateOrderStatus(orderRef, { status: "reserved", reservedUntil });
      } catch (err: any) {
        await updateOrderStatus(orderRef, { status: "error", errorMessage: err.message });
        return res.status(409).json({ error: err.message || "Ingressos insuficientes" });
      }

      let result;
      try {
        result = await createPixPayment({ orderRef, idempotencyKey, valorTotal, titular });
      } catch (err: any) {
        await releaseReservation(orderRef);
        await updateOrderStatus(orderRef, { status: "error", errorMessage: err.message });
        return res.status(502).json(safeErrorPayload(err, "Erro ao processar PIX"));
      }

      await updateOrderStatus(orderRef, {
        status: result.status === "paid" ? "paid" : "pending",
        cieloPaymentId: result.paymentId,
        cieloStatus: result.cieloStatus,
        pixQrCodeBase64: result.qrCodeBase64,
        pixQrCodeString: result.qrCodeString,
        reservedUntil,
      });

      if (result.status === "paid") {
        try {
          await fulfillReservedTickets(orderRef, result.paymentId, "pix", precoUnit, 1);
        } catch (err: any) {
          console.error(`[PAYMENTS] PIX pago imediato sem fulfill Ref:${orderRef}: ${err.message}`);
        }
      }

      return res.json({
        sucesso: true,
        metodoPagamento: "pix",
        orderRef,
        paymentId: result.paymentId,
        qrCodeBase64: result.qrCodeBase64 ?? null,
        qrCodeString: result.qrCodeString ?? null,
        status: result.status === "paid" ? "paid" : "pending",
        valorTotal,
        reservedUntil,
        sandbox: isSandbox(),
      });
    } catch (e: any) {
      console.error("[PAYMENTS] Erro PIX:", e.message);
      return res.status(500).json({ error: "Erro interno ao processar PIX" });
    }
  });

  app.post("/api/payments/card", requireEventosPortalAuth, async (req: Request, res: Response) => {
    const usuarioPortalId = (req as Request & { portalUserId: number }).portalUserId;

    try {
      const eventoId = parseInt(sanitize(req.body.eventoId), 10);
      const quantidade = parseQuantidade(req.body.quantidade);
      const parcelas = Math.max(1, Math.min(10, parseInt(String(req.body.parcelas || "1"), 10) || 1));
      const idempotencyKey = sanitize(req.body.idempotencyKey);
      const telefone = sanitize(req.body.telefone);
      const cartaoNumero = sanitize(req.body.cardNumber).replace(/\D/g, "");
      const cartaoTitular = sanitize(req.body.cardName);
      const cartaoValidade = sanitize(req.body.cardExpiry);
      const cartaoCvv = sanitize(req.body.cardCvv);

      if (!eventoId || !quantidade) {
        return res.status(400).json({ error: "Dados do comprador incompletos ou quantidade inválida" });
      }
      if (!cartaoNumero || cartaoNumero.length < 13 || !cartaoTitular || !cartaoValidade || !cartaoCvv) {
        return res.status(400).json({ error: "Dados do cartão incompletos" });
      }
      if (telefone.replace(/\D/g, "").length < 10) {
        return res.status(400).json({ error: "Telefone inválido" });
      }

      const usuario = await loadPortalTitular(usuarioPortalId);
      if (!usuario) return res.status(401).json({ error: "Usuário não encontrado" });
      const titular = {
        nome: usuario.nome,
        cpf: String(usuario.cpf || "").replace(/\D/g, ""),
        email: usuario.email,
        telefone,
      };
      if (titular.cpf.length !== 11) {
        return res.status(400).json({ error: "CPF inválido no cadastro" });
      }

      if (idempotencyKey) {
        const { rows: existing } = await pool.query(
          `SELECT order_ref, status, metodo_pagamento, cielo_payment_id FROM event_payment_orders WHERE idempotency_key=$1`,
          [idempotencyKey]
        );
        if (existing.length > 0) {
          const ord = existing[0];
          if (ord.status === "fulfilled" || ord.status === "paid") {
            return res.json({ sucesso: true, metodoPagamento: "cartao", orderRef: ord.order_ref, status: ord.status, jaProcessado: true });
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

      await reconcileExpiredOrders(eventoId);

      const { rows: [evento] } = await pool.query(
        `SELECT id, titulo, preco, gratuito, status FROM eventos_grito WHERE id=$1`,
        [eventoId]
      );
      if (!evento) return res.status(404).json({ error: "Evento não encontrado" });
      if (evento.gratuito || parseInt(evento.preco) === 0) {
        return res.status(400).json({ error: "Evento gratuito não requer pagamento" });
      }
      if (evento.status !== "disponivel") {
        return res.status(400).json({ error: "Evento não disponível para compra" });
      }

      const precoUnit = parseInt(evento.preco);
      const valorTotal = precoUnit * quantidade;
      const orderRef = generateOrderRef(eventoId);
      const bandeira = detectBrand(cartaoNumero);
      const reservedUntil = new Date(Date.now() + CARD_RESERVATION_MINUTES * 60 * 1000);

      try {
        await pool.query(
          `INSERT INTO event_payment_orders
             (evento_id, usuario_portal_id, order_ref, idempotency_key, metodo_pagamento,
              quantidade, valor_total, parcelas, status, titular_nome, titular_cpf, titular_email, titular_telefone, reserved_until)
           VALUES ($1,$2,$3,$4,'cartao',$5,$6,$7,'created',$8,$9,$10,$11,$12)`,
          [eventoId, usuarioPortalId, orderRef, idempotencyKey || null, quantidade, valorTotal, parcelas,
            titular.nome, titular.cpf, titular.email, titular.telefone, reservedUntil]
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

      try {
        await reserveTickets(eventoId, quantidade, orderRef, usuarioPortalId, titular, CARD_RESERVATION_MINUTES);
        await updateOrderStatus(orderRef, { status: "reserved", reservedUntil });
      } catch (err: any) {
        await updateOrderStatus(orderRef, { status: "error", errorMessage: err.message });
        return res.status(409).json({ error: err.message || "Ingressos insuficientes" });
      }

      await updateOrderStatus(orderRef, { status: "processing" });

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
        await releaseReservation(orderRef);
        await updateOrderStatus(orderRef, { status: "error", errorMessage: err.message });
        return res.status(502).json(safeErrorPayload(err, "Erro ao processar cartão"));
      }

      await updateOrderStatus(orderRef, {
        status: result.status,
        cieloPaymentId: result.paymentId,
        cieloStatus: result.cieloStatus,
        returnCode: result.returnCode,
        errorMessage: result.status !== "paid" ? result.returnMessage : undefined,
      });

      if (result.status !== "paid") {
        await releaseReservation(orderRef);
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

      let ingressos: { id: number; codigo: string }[];
      try {
        ingressos = await fulfillReservedTickets(
          orderRef, result.paymentId, "cartao", precoUnit, parcelas
        );
      } catch (err: any) {
        console.error(`[PAYMENTS] Pagamento aprovado mas falha ao atribuir ingressos: ${err.message} Ref:${orderRef}`);
        await updateOrderStatus(orderRef, { status: "paid", errorMessage: `Ingressos: ${err.message}` });
        return res.status(500).json({ error: "Pagamento aprovado mas houve erro ao gerar ingressos. Entre em contato." });
      }

      return res.json({
        sucesso: true,
        metodoPagamento: "cartao",
        orderRef,
        paymentId: result.paymentId,
        status: "fulfilled",
        ingressos,
        parcelas,
        valorTotal,
      });
    } catch (e: any) {
      console.error("[PAYMENTS] Erro cartão:", e.message);
      return res.status(500).json({ error: "Erro interno ao processar pagamento" });
    }
  });

  app.get("/api/payments/:orderRef/status", requireEventosPortalAuth, async (req: Request, res: Response) => {
    try {
      const { orderRef } = req.params;
      const usuarioPortalId = (req as Request & { portalUserId: number }).portalUserId;

      const { rows: [order] } = await pool.query(
        `SELECT * FROM event_payment_orders WHERE order_ref=$1`,
        [orderRef]
      );
      if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
      if (!assertOrderOwnedByPortalUser(order.usuario_portal_id, usuarioPortalId)) {
        return res.status(403).json({ error: "Pedido não pertence a este usuário" });
      }

      if (order.status === "fulfilled") {
        const { rows: ingressos } = await pool.query(
          `SELECT id, codigo FROM ingressos_portal WHERE order_ref=$1 AND status IN ('resgatado','usado')`,
          [orderRef]
        );
        return res.json({
          orderRef,
          status: "fulfilled",
          pago: true,
          ingressos,
          reservedUntil: order.reserved_until,
        });
      }

      // Reconcilia se passou do horário (consulta Cielo antes de liberar)
      if (order.reserved_until && new Date(order.reserved_until).getTime() < Date.now()
          && ["created", "reserved", "pending", "processing", "paid"].includes(order.status)) {
        await reconcileOneExpiredOrder(orderRef);
        const { rows: [fresh] } = await pool.query(
          `SELECT * FROM event_payment_orders WHERE order_ref=$1`,
          [orderRef]
        );
        if (fresh?.status === "fulfilled") {
          const { rows: ingressos } = await pool.query(
            `SELECT id, codigo FROM ingressos_portal WHERE order_ref=$1 AND status IN ('resgatado','usado')`,
            [orderRef]
          );
          return res.json({ orderRef, status: "fulfilled", pago: true, ingressos });
        }
        if (fresh?.status === "expired" || fresh?.status === "denied" || fresh?.status === "canceled" || fresh?.status === "error") {
          return res.json({
            orderRef,
            status: fresh.status,
            pago: false,
            erro: fresh.status === "expired" ? "Reserva expirada" : "Pagamento não concluído",
          });
        }
      }

      if (order.metodo_pagamento === "pix" && order.cielo_payment_id && !["fulfilled", "expired", "error"].includes(order.status)) {
        let cieloResult;
        try {
          cieloResult = await queryPaymentStatus(order.cielo_payment_id);
        } catch (err: any) {
          return res.json({
            orderRef,
            status: order.status,
            pago: false,
            erro: toClientError(err, "Erro ao consultar pagamento"),
            reservedUntil: order.reserved_until,
          });
        }

        if (cieloResult.status === "paid") {
          await updateOrderStatus(orderRef, {
            status: "paid",
            cieloStatus: cieloResult.cieloStatus,
          });

          const precoUnit = Math.round(order.valor_total / order.quantidade);
          let ingressos: { id: number; codigo: string }[] = [];
          try {
            ingressos = await fulfillReservedTickets(
              orderRef, order.cielo_payment_id, "pix", precoUnit, 1
            );
          } catch (err: any) {
            console.error(`[PAYMENTS] PIX confirmado mas falha ao atribuir ingressos: ${err.message} Ref:${orderRef}`);
            return res.json({ orderRef, status: "paid", pago: true, erro: "Pagamento confirmado; ingressos em processamento", ingressos: [] });
          }

          return res.json({ orderRef, status: "fulfilled", pago: true, ingressos });
        }

        if (["denied", "canceled", "expired", "error"].includes(cieloResult.status)) {
          await releaseReservation(orderRef);
          await updateOrderStatus(orderRef, { status: cieloResult.status as PaymentStatus, cieloStatus: cieloResult.cieloStatus });
          return res.json({ orderRef, status: cieloResult.status, pago: false, erro: "Pagamento não concluído" });
        }

        if (cieloResult.status !== order.status) {
          await updateOrderStatus(orderRef, { status: cieloResult.status, cieloStatus: cieloResult.cieloStatus });
        }

        return res.json({
          orderRef,
          status: cieloResult.status,
          pago: false,
          reservedUntil: order.reserved_until,
        });
      }

      return res.json({
        orderRef,
        status: order.status,
        pago: order.status === "paid" || order.status === "fulfilled",
        metodoPagamento: order.metodo_pagamento,
        valorTotal: order.valor_total,
        reservedUntil: order.reserved_until,
      });
    } catch (e: any) {
      console.error("[PAYMENTS] Erro status:", e.message);
      return res.status(500).json({ error: "Erro interno" });
    }
  });

  app.get("/api/payments/pix/:orderRef/qrcode", requireEventosPortalAuth, async (req: Request, res: Response) => {
    try {
      const { orderRef } = req.params;
      const usuarioPortalId = (req as Request & { portalUserId: number }).portalUserId;
      const { rows: [order] } = await pool.query(
        `SELECT pix_qr_code_base64, pix_qr_code_string, status, valor_total, usuario_portal_id, reserved_until
         FROM event_payment_orders WHERE order_ref=$1`,
        [orderRef]
      );
      if (!order) return res.status(404).json({ error: "Pedido não encontrado" });
      if (!assertOrderOwnedByPortalUser(order.usuario_portal_id, usuarioPortalId)) {
        return res.status(403).json({ error: "Pedido não pertence a este usuário" });
      }
      return res.json({
        qrCodeBase64: order.pix_qr_code_base64,
        qrCodeString: order.pix_qr_code_string,
        status: order.status,
        valorTotal: order.valor_total,
        reservedUntil: order.reserved_until,
      });
    } catch (e: any) {
      return res.status(500).json({ error: "Erro interno" });
    }
  });

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

      const { rows: [order] } = await pool.query(
        `SELECT * FROM event_payment_orders WHERE cielo_payment_id=$1`,
        [paymentId]
      );

      if (!order) {
        return res.status(200).json({ ok: true });
      }

      if (order.status === "fulfilled") {
        return res.status(200).json({ ok: true, msg: "Já processado" });
      }

      let cieloResult;
      try {
        cieloResult = await queryPaymentStatus(paymentId);
      } catch (err: any) {
        console.error(`[PAYMENTS] Webhook - falha ao consultar Cielo: ${err.message}`);
        return res.status(200).json({ ok: false });
      }

      if (cieloResult.status === "paid") {
        await updateOrderStatus(order.order_ref, {
          status: "paid",
          cieloStatus: cieloResult.cieloStatus,
        });
        const precoUnit = Math.round(order.valor_total / order.quantidade);
        try {
          await fulfillReservedTickets(
            order.order_ref, paymentId, order.metodo_pagamento, precoUnit, order.parcelas
          );
          console.log(`[PAYMENTS] Webhook: ingressos atribuídos Ref:${order.order_ref}`);
        } catch (err: any) {
          console.error(`[PAYMENTS] Webhook: falha ingressos Ref:${order.order_ref}: ${err.message}`);
        }
      } else if (["denied", "canceled", "expired", "error"].includes(cieloResult.status)) {
        await releaseReservation(order.order_ref);
        await updateOrderStatus(order.order_ref, {
          status: cieloResult.status,
          cieloStatus: cieloResult.cieloStatus,
        });
      } else {
        await updateOrderStatus(order.order_ref, {
          status: cieloResult.status,
          cieloStatus: cieloResult.cieloStatus,
        });
      }

      return res.status(200).json({ ok: true });
    } catch (e: any) {
      console.error("[PAYMENTS] Erro webhook:", e.message);
      return res.status(200).json({ ok: false });
    }
  });
}

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
