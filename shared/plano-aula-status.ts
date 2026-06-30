/** Status exibidos na UI (rascunho permanece só no banco). */
export function isPlanoStatusExibivel(status: string | null | undefined): boolean {
  const s = String(status ?? "").toLowerCase();
  return s === "aprovado" || s === "aplicado";
}

export function labelPlanoStatusExibivel(status: string | null | undefined): string | null {
  if (status === "aprovado") return "Aprovado";
  if (status === "aplicado") return "Aplicado";
  return null;
}

/** Respostas da API: omite rascunho para não exibir badge nas telas. */
export function statusPlanoParaApi(status: string | null | undefined): string | null {
  return isPlanoStatusExibivel(status) ? (status ?? null) : null;
}
