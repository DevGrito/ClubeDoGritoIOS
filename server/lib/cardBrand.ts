/**
 * Detecta a bandeira do cartão pelos primeiros dígitos (BIN)
 * @param cardNumber Número do cartão (com ou sem espaços/traços)
 * @returns Bandeira detectada ou 'Unknown'
 */
export function detectCardBrand(cardNumber: string): 'Visa' | 'Master' | 'Amex' | 'Elo' | 'Hipercard' | 'Diners' | 'Discover' | 'JCB' | 'Aura' | 'Unknown' {
  // Limpar número do cartão (remover espaços, traços, etc)
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (!cleaned) return 'Unknown';

  // Visa: começa com 4
  if (/^4/.test(cleaned)) {
    return 'Visa';
  }

  // Mastercard: 51-55, 2221-2720
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) {
    return 'Master';
  }

  // American Express: 34 ou 37
  if (/^3[47]/.test(cleaned)) {
    return 'Amex';
  }

  // Elo: vários BINs
  const eloBins = [
    '401178', '401179', '438935', '457631', '457632', '431274',
    '451416', '457393', '504175', '506699', '506770', '506771',
    '506772', '506773', '506774', '506775', '506776', '506777',
    '506778', '627780', '636297', '636368', '650031', '650032',
    '650033', '650035', '650036', '650037', '650038', '650039',
    '650040', '650041', '650042', '650043', '650044', '650045',
    '650046', '650047', '650048', '650049', '650050', '650051',
    '650405', '650406', '650407', '650408', '650409', '650410',
    '650411', '650412', '650413', '650414', '650415', '650416',
    '650417', '650418', '650419', '650420', '650421', '650422',
    '650423', '650424', '650425', '650426', '650427', '650428',
    '650429', '650430', '650431', '650432', '650433', '650434',
    '650435', '650436', '650437', '650438', '650439', '650440',
    '650485', '650486', '650487', '650488', '650489', '650490'
  ];
  
  for (const bin of eloBins) {
    if (cleaned.startsWith(bin)) {
      return 'Elo';
    }
  }

  // Hipercard: 384100, 384140, 384160, 606282, 637095, 637568, 60
  if (/^(384100|384140|384160|606282|637095|637568|60)/.test(cleaned)) {
    return 'Hipercard';
  }

  // Diners: 36, 38, 300-305
  if (/^(36|38|30[0-5])/.test(cleaned)) {
    return 'Diners';
  }

  // Discover: 6011, 622126-622925, 644-649, 65
  if (/^(6011|622[1-9]|64[4-9]|65)/.test(cleaned)) {
    return 'Discover';
  }

  // JCB: 35
  if (/^35/.test(cleaned)) {
    return 'JCB';
  }

  // Aura: 50
  if (/^50/.test(cleaned)) {
    return 'Aura';
  }

  return 'Unknown';
}

/**
 * Formata número de cartão com espaços (4 em 4 dígitos)
 * @param cardNumber Número do cartão
 * @returns Número formatado
 */
export function formatCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '');
  const match = cleaned.match(/.{1,4}/g);
  return match ? match.join(' ') : cleaned;
}

/**
 * Valida se o número de cartão é válido (Luhn algorithm)
 * @param cardNumber Número do cartão
 * @returns true se válido
 */
export function isValidCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return (sum % 10) === 0;
}
