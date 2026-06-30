/**
 * CieloService — Integração Cielo eCommerce API 3.0
 *
 * Ambiente:
 *   CIELO_ENV=prod        → produção
 *   (qualquer outro valor) → sandbox (padrão)
 *
 * Credenciais (nunca hardcode):
 *   CIELO_MERCHANT_ID
 *   CIELO_MERCHANT_KEY
 */

export type PaymentStatus =
  | "created"
  | "pending"
  | "processing"
  | "paid"
  | "denied"
  | "cancelled"
  | "error"
  | "expired";

export interface CieloConfig {
  merchantId: string;
  merchantKey: string;
  sandbox: boolean;
}

export interface CreateCardPaymentInput {
  orderRef: string;
  idempotencyKey: string;
  valorTotal: number;
  parcelas: number;
  titular: { nome: string; cpf: string; email: string; telefone: string };
  cartao: { numero: string; titular: string; validade: string; cvv: string; bandeira: string };
}

export interface CreatePixPaymentInput {
  orderRef: string;
  idempotencyKey: string;
  valorTotal: number;
  titular: { nome: string; cpf: string; email: string };
}

export interface CieloPaymentResult {
  paymentId: string;
  status: PaymentStatus;
  cieloStatus: number;
  returnCode?: string;
  returnMessage?: string;
  // PIX
  qrCodeBase64?: string;
  qrCodeString?: string;
  // Cartão
  authorizationCode?: string;
}

function getConfig(): CieloConfig {
  const merchantId = (process.env.CIELO_MERCHANT_ID ?? "").trim();
  const merchantKey = (process.env.CIELO_MERCHANT_KEY ?? "").trim();
  if (!merchantId || !merchantKey) {
    throw new Error("Credenciais Cielo não configuradas (CIELO_MERCHANT_ID / CIELO_MERCHANT_KEY)");
  }
  return {
    merchantId,
    merchantKey,
    sandbox: process.env.CIELO_ENV !== "prod",
  };
}

function getBaseUrl(config: CieloConfig, queryApi = false): string {
  if (config.sandbox) {
    return queryApi
      ? "https://apiquerysandbox.cieloecommerce.cielo.com.br"
      : "https://apisandbox.cieloecommerce.cielo.com.br";
  }
  return queryApi
    ? "https://apiquery.cieloecommerce.cielo.com.br"
    : "https://api.cieloecommerce.cielo.com.br";
}

async function callCielo(
  path: string,
  method: "GET" | "POST" | "PUT",
  body?: unknown,
  useQueryUrl = false,
  requestId?: string
): Promise<{ status: number; data: any }> {
  const config = getConfig();
  const baseUrl = getBaseUrl(config, useQueryUrl);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);

  try {
    const resp = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        MerchantId: config.merchantId,
        MerchantKey: config.merchantKey,
        ...(requestId ? { RequestId: requestId } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const text = await resp.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return { status: resp.status, data };
  } catch (e: any) {
    clearTimeout(timer);
    if (e.name === "AbortError") throw new Error("Timeout na comunicação com a Cielo (>25s)");
    throw e;
  }
}

export function detectBrand(cardNumber: string): string {
  const n = cardNumber.replace(/\D/g, "");
  if (/^4/.test(n)) return "Visa";
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]))/.test(n)) return "Master";
  if (/^3[47]/.test(n)) return "Amex";
  if (/^(6362|636368|438935|504175|451416|636297|5067|4576|4011)/.test(n)) return "Elo";
  if (/^(606282|3841)/.test(n)) return "Hipercard";
  if (/^(301|305|3095|36|38)/.test(n)) return "Diners";
  return "Visa";
}

export function mapCieloStatus(cieloStatus: number): PaymentStatus {
  switch (cieloStatus) {
    case 0: return "created";
    case 1: return "processing";
    case 2: return "paid";
    case 3: return "denied";
    case 10: return "cancelled";
    case 11: return "cancelled";
    case 12: return "pending";
    case 13: return "cancelled";
    case 20: return "cancelled";
    default: return "error";
  }
}

function maskCpf(cpf: string): string {
  const c = cpf.replace(/\D/g, "");
  return c.length >= 11 ? `${c.slice(0, 3)}.***.***-${c.slice(-2)}` : "***";
}

export async function createCardPayment(input: CreateCardPaymentInput): Promise<CieloPaymentResult> {
  const { orderRef, idempotencyKey, valorTotal, parcelas, titular, cartao } = input;
  const [mm, aa] = cartao.validade.split("/");
  const expiryFull = aa ? `${mm}/20${aa.slice(-2)}` : cartao.validade;

  console.log(`[CIELO] Cartão - Ref:${orderRef} Valor:${valorTotal} Parcelas:${parcelas} CPF:${maskCpf(titular.cpf)}`);

  const payload = {
    MerchantOrderId: orderRef,
    Customer: {
      Name: titular.nome,
      Identity: titular.cpf.replace(/\D/g, ""),
      IdentityType: "CPF",
      Email: titular.email,
    },
    Payment: {
      Type: "CreditCard",
      Amount: valorTotal,
      Installments: Math.min(10, Math.max(1, parcelas)),
      Capture: true,
      Interest: "ByMerchant",
      SoftDescriptor: "Instituto O Grito",
      CreditCard: {
        CardNumber: cartao.numero.replace(/\D/g, ""),
        Holder: cartao.titular.toUpperCase().trim(),
        ExpirationDate: expiryFull,
        SecurityCode: cartao.cvv,
        Brand: cartao.bandeira,
        SaveCard: false,
      },
    },
  };

  const requestId = (idempotencyKey || orderRef).slice(0, 50);
  const { status: httpStatus, data } = await callCielo("/1/sales", "POST", payload, false, requestId);

  if (httpStatus === 401) {
    console.error(`[CIELO] Não autorizado (401) Ref:${orderRef} Verifique MerchantId/MerchantKey e ambiente CIELO_ENV`);
    throw new Error("Cielo não autorizou a requisição (401). Verifique CIELO_MERCHANT_ID, CIELO_MERCHANT_KEY e CIELO_ENV.");
  }

  if (httpStatus >= 500) {
    console.error(`[CIELO] Erro servidor Ref:${orderRef} HTTP:${httpStatus}`);
    throw new Error("Erro no servidor da Cielo. Tente novamente.");
  }

  const payment = data?.Payment;
  if (!payment) {
    console.error(`[CIELO] Resposta sem Payment - HTTP:${httpStatus} Ref:${orderRef} Body:${JSON.stringify(data)}`);
    throw new Error("Resposta inválida da Cielo");
  }

  const cieloStatus: number = payment.Status ?? -1;
  const status = mapCieloStatus(cieloStatus);

  console.log(`[CIELO] Cartão - Status:${cieloStatus}(${status}) Ref:${orderRef} ReturnCode:${payment.ReturnCode}`);

  return {
    paymentId: payment.PaymentId,
    status,
    cieloStatus,
    returnCode: payment.ReturnCode,
    returnMessage: payment.ReturnMessage,
    authorizationCode: payment.AuthorizationCode,
  };
}

export async function createPixPayment(input: CreatePixPaymentInput): Promise<CieloPaymentResult> {
  const { orderRef, idempotencyKey, valorTotal, titular } = input;

  console.log(`[CIELO] PIX - Ref:${orderRef} Valor:${valorTotal} CPF:${maskCpf(titular.cpf)}`);

  const payload = {
    MerchantOrderId: orderRef,
    Customer: {
      Name: titular.nome,
      Identity: titular.cpf.replace(/\D/g, ""),
      IdentityType: "CPF",
      Email: titular.email,
    },
    Payment: {
      Type: "Pix",
      Amount: valorTotal,
    },
  };

  const requestId = (idempotencyKey || orderRef).slice(0, 50);
  const { status: httpStatus, data } = await callCielo("/1/sales", "POST", payload, false, requestId);

  if (httpStatus === 401) {
    console.error(`[CIELO] PIX não autorizado (401) Ref:${orderRef} Verifique MerchantId/MerchantKey e ambiente CIELO_ENV`);
    throw new Error("Cielo não autorizou a requisição PIX (401). Verifique CIELO_MERCHANT_ID, CIELO_MERCHANT_KEY e CIELO_ENV.");
  }

  if (httpStatus >= 500) {
    console.error(`[CIELO] Erro servidor PIX Ref:${orderRef} HTTP:${httpStatus}`);
    throw new Error("Erro no servidor da Cielo. Tente novamente.");
  }

  const payment = data?.Payment;
  if (!payment) {
    console.error(`[CIELO] Resposta sem Payment (PIX) - HTTP:${httpStatus} Ref:${orderRef} Body:${JSON.stringify(data)}`);
    throw new Error("Resposta inválida da Cielo");
  }

  const cieloStatus: number = payment.Status ?? -1;
  const status = mapCieloStatus(cieloStatus);

  console.log(
    `[CIELO] PIX - Status:${cieloStatus}(${status}) PaymentId:${payment.PaymentId} ` +
    `QrBase64:${payment.QrCodeBase64Image ? "SIM" : "NÃO"} QrString:${payment.QrCodeString ? "SIM" : "NÃO"}`
  );

  return {
    paymentId: payment.PaymentId,
    status,
    cieloStatus,
    qrCodeBase64: payment.QrCodeBase64Image ?? undefined,
    qrCodeString: payment.QrCodeString ?? payment.PixQrCode ?? undefined,
  };
}

export async function queryPaymentStatus(paymentId: string): Promise<{
  cieloStatus: number;
  status: PaymentStatus;
  returnCode?: string;
}> {
  const { data } = await callCielo(`/1/sales/${paymentId}`, "GET", undefined, true);
  const payment = data?.Payment;
  if (!payment) throw new Error("Pagamento não encontrado na Cielo");
  const cieloStatus: number = payment.Status ?? -1;
  return { cieloStatus, status: mapCieloStatus(cieloStatus), returnCode: payment.ReturnCode };
}

export function isSandbox(): boolean {
  return process.env.CIELO_ENV !== "prod";
}
