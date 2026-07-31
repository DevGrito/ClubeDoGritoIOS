export const PIX_RESERVATION_MINUTES = 30;
export const CARD_RESERVATION_MINUTES = 15;
/** Margem após reserved_until antes de liberar estoque sem confirmação Cielo. */
export const EXPIRATION_GRACE_MS = 2 * 60 * 1000;

export function sanitize(str: unknown): string {
  return typeof str === "string" ? str.trim() : "";
}

export function generateOrderRef(eventoId: number): string {
  return `EVT${eventoId}-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export function parseQuantidade(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : parseInt(String(raw ?? ""), 10);
  if (!Number.isInteger(n) || n < 1 || n > 10) return null;
  return n;
}

export type ExpirationDecision =
  | { action: "wait" }
  | { action: "keep_pending" }
  | { action: "fulfill"; paymentId: string }
  | { action: "release"; status: string };

/**
 * Decide o que fazer com um pedido cuja reserva passou do horário.
 * Nunca libera estoque se a Cielo já confirmou pagamento.
 */
export function decideExpiredOrderAction(input: {
  now: number;
  reservedUntil: number | null | undefined;
  orderStatus: string;
  cieloStatus?: string | null;
  cieloPaymentId?: string | null;
  graceMs?: number;
}): ExpirationDecision {
  const status = String(input.orderStatus || "");
  if (["fulfilled", "paid"].includes(status) && input.cieloPaymentId && input.cieloStatus === "paid") {
    return { action: "fulfill", paymentId: String(input.cieloPaymentId) };
  }
  if (status === "fulfilled") {
    return { action: "wait" };
  }

  const reservedUntil = input.reservedUntil == null ? null : Number(input.reservedUntil);
  if (reservedUntil == null || Number.isNaN(reservedUntil) || reservedUntil > input.now) {
    return { action: "wait" };
  }

  if (input.cieloStatus === "paid" && input.cieloPaymentId) {
    return { action: "fulfill", paymentId: String(input.cieloPaymentId) };
  }

  if (input.cieloStatus && ["denied", "canceled", "expired", "error"].includes(input.cieloStatus)) {
    return { action: "release", status: input.cieloStatus };
  }

  const grace = input.graceMs ?? EXPIRATION_GRACE_MS;
  if (input.now < reservedUntil + grace) {
    return { action: "keep_pending" };
  }

  return { action: "release", status: "expired" };
}

export function assertOrderOwnedByPortalUser(
  orderUserId: number | null | undefined,
  sessionUserId: number
): boolean {
  return Number(orderUserId) === Number(sessionUserId);
}
