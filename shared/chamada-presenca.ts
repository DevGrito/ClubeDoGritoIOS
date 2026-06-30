/** Chamada PEC/Inclusão tem foto comprovante (JSON array ou campo legado). */
export function chamadaTemFotoComprovante(c: {
  fotoComprovante?: string | null;
  foto_comprovante?: string | null;
  presencas?: Array<{ fotoComprovante?: string | null; foto_comprovante?: string | null }>;
} | null | undefined): boolean {
  if (!c) return false;
  const fc = c.fotoComprovante ?? c.foto_comprovante;
  if (fc) {
    try {
      const arr = JSON.parse(fc);
      if (Array.isArray(arr)) return arr.length > 0;
      return true;
    } catch {
      return true;
    }
  }
  return !!(c.presencas || []).some((p) => p.fotoComprovante || p.foto_comprovante);
}

export function chamadaEhPec(c: { tipo?: string; id?: string | number; sessaoId?: number } | null | undefined): boolean {
  if (!c) return false;
  if (c.tipo === "pec") return true;
  return String(c.id ?? "").startsWith("pec_") || !!c.sessaoId;
}

/** PEC: sessão com presenças gravadas; Inclusão: grupo com registros. */
export function chamadaTemRegistroPresenca(c: {
  tipo?: string;
  id?: string | number;
  sessaoId?: number;
  presencas?: unknown[];
  attendance?: unknown[];
  totalAlunos?: number;
} | null | undefined): boolean {
  if (!c) return false;
  if (chamadaEhPec(c)) {
    const att = c.presencas ?? c.attendance;
    return Array.isArray(att) && att.length > 0;
  }
  return !!(c.presencas?.length || (c.totalAlunos && c.totalAlunos > 0));
}

/** Pendente = já lançada, mas sem foto comprovante. */
export function chamadaEstaPendente(c: Parameters<typeof chamadaTemFotoComprovante>[0]): boolean {
  if (!c) return false;
  if (chamadaEhPec(c)) {
    return chamadaTemRegistroPresenca(c) && !chamadaTemFotoComprovante(c);
  }
  return chamadaTemRegistroPresenca(c) && !chamadaTemFotoComprovante(c);
}

/** Data já usada (finalizada ou pendente) — não deve aparecer para novo lançamento. */
export function chamadaOcupaDataLancamento(c: Parameters<typeof chamadaTemRegistroPresenca>[0]): boolean {
  if (!c) return false;
  if (chamadaEhPec(c)) {
    return chamadaTemRegistroPresenca(c) || !!c.sessaoId;
  }
  return chamadaTemRegistroPresenca(c);
}
