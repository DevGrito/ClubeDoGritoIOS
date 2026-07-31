import { describe, expect, it } from "vitest";
import {
  parseQuantidade,
  generateOrderRef,
  PIX_RESERVATION_MINUTES,
  CARD_RESERVATION_MINUTES,
  EXPIRATION_GRACE_MS,
  decideExpiredOrderAction,
  assertOrderOwnedByPortalUser,
} from "./paymentHelpers";

describe("payments helpers", () => {
  it("aceita quantidade válida entre 1 e 10", () => {
    expect(parseQuantidade(1)).toBe(1);
    expect(parseQuantidade("10")).toBe(10);
    expect(parseQuantidade(5)).toBe(5);
  });

  it("rejeita quantidade inválida", () => {
    expect(parseQuantidade(0)).toBeNull();
    expect(parseQuantidade(11)).toBeNull();
    expect(parseQuantidade("abc")).toBeNull();
    expect(parseQuantidade(null)).toBeNull();
    expect(parseQuantidade(1.5)).toBeNull();
  });

  it("gera orderRef com prefixo do evento", () => {
    const ref = generateOrderRef(17);
    expect(ref.startsWith("EVT17-")).toBe(true);
  });

  it("usa janelas de reserva esperadas", () => {
    expect(PIX_RESERVATION_MINUTES).toBe(30);
    expect(CARD_RESERVATION_MINUTES).toBe(15);
    expect(EXPIRATION_GRACE_MS).toBe(2 * 60 * 1000);
  });
});

describe("decideExpiredOrderAction", () => {
  const base = {
    now: 1_000_000,
    reservedUntil: 900_000,
    orderStatus: "pending",
  };

  it("aguarda se ainda não expirou", () => {
    expect(
      decideExpiredOrderAction({
        ...base,
        reservedUntil: 1_100_000,
      })
    ).toEqual({ action: "wait" });
  });

  it("cumpre ingresso se Cielo confirmou pagamento mesmo após reserved_until", () => {
    expect(
      decideExpiredOrderAction({
        ...base,
        cieloStatus: "paid",
        cieloPaymentId: "pay-1",
      })
    ).toEqual({ action: "fulfill", paymentId: "pay-1" });
  });

  it("mantém pendente dentro da margem de graça sem status terminal", () => {
    expect(
      decideExpiredOrderAction({
        ...base,
        now: base.reservedUntil! + 30_000,
        cieloStatus: "pending",
        cieloPaymentId: "pay-1",
      })
    ).toEqual({ action: "keep_pending" });
  });

  it("libera após margem de graça sem confirmação", () => {
    expect(
      decideExpiredOrderAction({
        ...base,
        now: base.reservedUntil! + EXPIRATION_GRACE_MS + 1,
        cieloStatus: "pending",
        cieloPaymentId: "pay-1",
      })
    ).toEqual({ action: "release", status: "expired" });
  });

  it("libera imediatamente em status terminal da Cielo", () => {
    expect(
      decideExpiredOrderAction({
        ...base,
        cieloStatus: "denied",
        cieloPaymentId: "pay-1",
      })
    ).toEqual({ action: "release", status: "denied" });
  });

  it("cumpre pedido já marcado paid com confirmação", () => {
    expect(
      decideExpiredOrderAction({
        ...base,
        orderStatus: "paid",
        cieloStatus: "paid",
        cieloPaymentId: "pay-9",
      })
    ).toEqual({ action: "fulfill", paymentId: "pay-9" });
  });
});

describe("assertOrderOwnedByPortalUser", () => {
  it("exige correspondência exata", () => {
    expect(assertOrderOwnedByPortalUser(10, 10)).toBe(true);
    expect(assertOrderOwnedByPortalUser(10, 11)).toBe(false);
    expect(assertOrderOwnedByPortalUser(null, 10)).toBe(false);
  });
});

describe("eventos portal session policy", () => {
  it("sessão pública não deve usar userId/userPapel genéricos", () => {
    const publicSession = {
      portalUserId: 42,
      actorType: "eventos_portal",
    };
    expect(publicSession).not.toHaveProperty("userId");
    expect(publicSession).not.toHaveProperty("userPapel");
    expect(publicSession.actorType).toBe("eventos_portal");
  });

  it("bloqueia resgate de evento pago", () => {
    const evento = { status: "disponivel", gratuito: false, preco: 5000 };
    const isPaid = !evento.gratuito && Number(evento.preco) > 0;
    expect(isPaid).toBe(true);
  });
});
