export const PSICO_ATENDIMENTO_COLETIVO_CATEGORIAS = [
  { value: "espaco_o_grito", label: "Espaço O Grito" },
  { value: "caravana_comunitaria", label: "Caravana Comunitária" },
  { value: "workshop", label: "Workshop" },
] as const;

export const PSICO_CATEGORIA_COLETIVO_LABELS: Record<string, string> = Object.fromEntries(
  PSICO_ATENDIMENTO_COLETIVO_CATEGORIAS.map((c) => [c.value, c.label])
);

/** Caravana e Workshop — seleção múltipla de participantes (incl. comunidade). */
export function isPsicoCategoriaMultiParticipante(categoria: string): boolean {
  return (
    categoria === "caravana_comunitaria" ||
    categoria === "workshop"
  );
}

export function isPsicoCategoriaEspacoOGrito(categoria: string): boolean {
  return categoria === "espaco_o_grito";
}
