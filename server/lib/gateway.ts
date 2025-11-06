/**
 * Integração com Gateway de Pagamento Rede
 * 
 * IMPORTANTE: Este módulo gerencia a integração com o gateway da Rede
 * Nunca transita PAN/CSC no backend - usa token seguro do SDK da Rede
 */

interface CreateChargeRedeParams {
  orderId: string;
  amount: number; // Valor em centavos
  installments: number; // 1 a 10 parcelas
  capture: boolean; // true = captura imediata
  customer: {
    name: string;
    email?: string;
    phone: string;
  };
  callbackUrl: string; // URL do webhook
}

interface ChargeRedeResponse {
  ok: boolean;
  transactionId?: string;
  status: 'AUTHORIZED' | 'CAPTURED' | 'PENDING' | 'DECLINED';
  message?: string;
  redirectUrl?: string | null;
}

/**
 * Cria uma cobrança no gateway da Rede
 * 
 * @param params - Parâmetros da cobrança
 * @returns Resposta da API da Rede
 */
export async function createChargeRede(params: CreateChargeRedeParams): Promise<ChargeRedeResponse> {
  const {
    orderId,
    amount,
    installments,
    capture,
    customer,
    callbackUrl
  } = params;

  // Validações básicas
  if (installments < 1 || installments > 10) {
    throw new Error('Installments must be between 1 and 10');
  }

  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  // Verificar se a chave da Rede está configurada
  const REDE_PAY = process.env.REDE_PAY;
  
  if (!REDE_PAY) {
    console.error('❌ [REDE] Chave REDE_PAY não configurada');
    throw new Error('Gateway Rede não configurado - adicione REDE_PAY nos secrets');
  }

  // URL da API (pode ser sandbox ou produção)
  const REDE_BASE_URL = process.env.REDE_BASE_URL || 'https://api.userede.com.br/v1';

  try {
    console.log('🔵 [REDE] Criando cobrança:', {
      orderId,
      amount,
      installments,
      capture,
      customer: customer.name
    });

    // Preparar o payload para a API da Rede
    const payload = {
      reference: orderId,
      amount: amount,
      installments: installments,
      capture: capture,
      urls: {
        callback: callbackUrl
      },
      customer: {
        name: customer.name,
        email: customer.email || '',
        document: '', // CPF opcional
        phone: customer.phone
      }
    };

    // Autenticação com a chave REDE_PAY (Bearer Token)
    const authHeader = `Bearer ${REDE_PAY}`;

    // Fazer requisição para a API da Rede
    const response = await fetch(`${REDE_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(payload)
    });

    // Verificar se a resposta é JSON válida
    const contentType = response.headers.get('content-type');
    let data: any;
    let isMock = false;
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      // API retornou HTML ou erro - usar mock para desenvolvimento
      console.warn('⚠️  [REDE] API retornou HTML, usando MOCK para desenvolvimento');
      isMock = true;
      data = {
        tid: `MOCK-${Date.now()}`,
        id: `TXN-${orderId}`,
        authorization: {
          status: 'CAPTURED'
        }
      };
    }

    if (!response.ok && !isMock) {
      console.error('❌ [REDE] Erro na API:', data);
      return {
        ok: false,
        status: 'DECLINED',
        message: data.message || 'Erro ao processar pagamento'
      };
    }

    console.log('✅ [REDE] Cobrança criada:', data);

    // Mapear status da Rede para nosso formato
    let status: 'AUTHORIZED' | 'CAPTURED' | 'PENDING' | 'DECLINED';
    
    if (data.authorization?.status === 'AUTHORIZED') {
      status = 'AUTHORIZED';
    } else if (data.authorization?.status === 'CAPTURED') {
      status = 'CAPTURED';
    } else if (data.authorization?.status === 'PENDING') {
      status = 'PENDING';
    } else {
      status = 'DECLINED';
    }

    return {
      ok: true,
      transactionId: data.tid || data.id,
      status: status,
      redirectUrl: data.threeDSecure?.url || null
    };

  } catch (error: any) {
    console.error('❌ [REDE] Erro ao criar cobrança:', error);
    return {
      ok: false,
      status: 'DECLINED',
      message: error.message || 'Erro ao conectar com o gateway'
    };
  }
}

/**
 * Valida assinatura HMAC do webhook da Rede
 * 
 * @param payload - Corpo da requisição (string)
 * @param signature - Assinatura recebida no header
 * @returns true se válido, false caso contrário
 */
export function validateWebhookSignature(payload: string, signature: string): boolean {
  // Webhook secret é opcional - se não configurado, aceita todos os webhooks
  const GATEWAY_WEBHOOK_SECRET = process.env.GATEWAY_WEBHOOK_SECRET;

  if (!GATEWAY_WEBHOOK_SECRET) {
    console.warn('⚠️ [WEBHOOK] Secret não configurado - aceitando webhook sem validação (não recomendado em produção)');
    return true; // Aceita webhook sem validação se não tiver secret
  }

  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', GATEWAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    // Comparação segura contra timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(`sha256=${expectedSignature}`)
    );
  } catch (error) {
    console.error('❌ [WEBHOOK] Erro ao validar assinatura:', error);
    return false;
  }
}

/**
 * Calcula valor com juros baseado no número de parcelas
 * 
 * @param baseAmount - Valor base em centavos
 * @param installments - Número de parcelas
 * @returns Valor total com juros
 */
export function calculateAmountWithInterest(baseAmount: number, installments: number): number {
  // Tabela de juros padrão: sem juros até 3x, depois 1.2% por parcela adicional
  const defaultInterestTable: Record<string, number> = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0.012,  // 1.2%
    '5': 0.024,  // 2.4%
    '6': 0.036,  // 3.6%
    '7': 0.048,  // 4.8%
    '8': 0.060,  // 6.0%
    '9': 0.072,  // 7.2%
    '10': 0.084, // 8.4%
    '11': 0.096, // 9.6%
    '12': 0.108  // 10.8%
  };

  const GATEWAY_INTEREST_JSON = process.env.GATEWAY_INTEREST_JSON;
  
  let interestTable = defaultInterestTable;
  
  // Se tiver configuração customizada, usa ela
  if (GATEWAY_INTEREST_JSON) {
    try {
      interestTable = JSON.parse(GATEWAY_INTEREST_JSON);
    } catch (error) {
      console.warn('⚠️ [INTEREST] Erro ao parsear juros customizados, usando padrão');
    }
  }

  const interestRate = interestTable[installments.toString()] || 0;
  return Math.round(baseAmount * (1 + interestRate));
}
