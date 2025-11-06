export function toE164BR(input: string): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");

  // já veio com DDI?
  // aceita 13 dígitos: 55 + DDD(2) + número(9/8)
  if (digits.length === 13 && digits.startsWith("55")) return `+${digits}`;

  // nacional: DDD(2) + número(8/9)
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;

  // já veio com + no início?
  if (digits.length === 13 && input.trim().startsWith("+")) return `+${digits}`;

  return null;
}