// ─── CPF ───────────────────────────────────────────────────────────────────
export function formatCPF(value: string): string {
  const n = value.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 3) return n;
  if (n.length <= 6) return `${n.slice(0,3)}.${n.slice(3)}`;
  if (n.length <= 9) return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6)}`;
  return `${n.slice(0,3)}.${n.slice(3,6)}.${n.slice(6,9)}-${n.slice(9)}`;
}

export function validarCPF(cpf: string): boolean {
  const n = cpf.replace(/\D/g, "");
  if (n.length !== 11) return false;
  // Rejeita sequências repetidas: 000.000.000-00, 111.111.111-11, etc.
  if (/^(\d)\1+$/.test(n)) return false;
  // Primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(n[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(n[9])) return false;
  // Segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(n[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  return resto === parseInt(n[10]);
}

// ─── E-mail ────────────────────────────────────────────────────────────────
export function validarEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

// ─── Senha forte ───────────────────────────────────────────────────────────
const SEQUENCIAS = [
  "123456789", "987654321", "12345678", "23456789",
  "abcdefgh", "hgfedcba", "qwertyui", "asdfghjk", "zxcvbnm",
  "qwerty", "asdfgh", "123456", "654321", "111111", "000000",
  "senha123", "password", "passw0rd",
];

export interface SenhaForça {
  minLength: boolean;
  temMaiuscula: boolean;
  temMinuscula: boolean;
  temNumero: boolean;
  temEspecial: boolean;
  semSequencia: boolean;
}

export function analisarSenha(senha: string): SenhaForça {
  const lower = senha.toLowerCase();
  const temSeq = SEQUENCIAS.some(seq => lower.includes(seq));
  return {
    minLength:    senha.length >= 8,
    temMaiuscula: /[A-Z]/.test(senha),
    temMinuscula: /[a-z]/.test(senha),
    temNumero:    /[0-9]/.test(senha),
    temEspecial:  /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha),
    semSequencia: !temSeq,
  };
}

export function senhaValida(senha: string): boolean {
  const f = analisarSenha(senha);
  return f.minLength && f.temMaiuscula && f.temMinuscula && f.temNumero && f.temEspecial && f.semSequencia;
}

export function senhaForcaScore(senha: string): number {
  const f = analisarSenha(senha);
  return Object.values(f).filter(Boolean).length; // 0-6
}
