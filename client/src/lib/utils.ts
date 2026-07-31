import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return "-";
  const digits = String(cpf).replace(/\D/g, "");
  if (digits.length !== 11) return String(cpf);
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function isCpfPlaceholder(digits: string): boolean {
  if (!digits || digits.length !== 11) return true;
  if (/^0+$/.test(digits)) return true;
  // 00000000001 .. 00000000099 — CPFs inventados reutilizados no cadastro comunidade
  if (/^0{8}\d{3}$/.test(digits)) return true;
  return false;
}

/** Remove duplicatas na busca (mesmo CPF real+origem, ou mesmo nome+origem). */
export function dedupeParticipantesBusca<T extends Record<string, any>>(list: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const p of list) {
    const cpf = String(p.cpf ?? p.__doc ?? "").replace(/\D/g, "");
    const vert = String(p.__vertente ?? p.origem ?? p.programa_origem ?? "").toLowerCase();
    const nome = String(p.__nome ?? p.nome ?? p.label ?? "").trim().toLowerCase();
    if (!cpf && !nome) continue;
    // CPF placeholder não identifica pessoa — dedupe só por nome
    const key =
      cpf && !isCpfPlaceholder(cpf)
        ? `${vert}|cpf:${cpf}`
        : `${vert}|nome:${nome}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}
