/** CPF canônico: somente 11 dígitos (sem máscara). */
export function normalizeCpfDigits(raw: unknown): string {
  return String(raw ?? "").replace(/\D/g, "");
}

export function isValidCpfLength(cpf: string): boolean {
  return normalizeCpfDigits(cpf).length === 11;
}

/** CPF provisório institucional: 00000000XXX (8 zeros + 3 dígitos). */
export function isCpfProvisorio(raw: unknown): boolean {
  const digits = normalizeCpfDigits(raw);
  return digits.length === 11 && digits.startsWith("00000000");
}
