/** Justificativas obrigatórias para chamada manual no tablet. */
export const TABLET_JUSTIFICATIVAS_MANUAL = [
  "Tablet ou sistema indisponível",
  "Turma sem foto no sistema",
  "Reconhecimento facial falhou",
  "Esquecimento ou chamada retroativa",
  "Outro",
] as const;

export type TabletJustificativaManual = (typeof TABLET_JUSTIFICATIVAS_MANUAL)[number];

export const JUSTIFICATIVA_SEM_FOTO = "Turma sem foto no sistema";

/** Opções de justificativa de falta (chamada manual — monitor / tablet). */
export const FALTA_JUSTIFICATIVAS_OPCOES = [
  "Doença",
  "Atestado médico",
  "Escola",
  "Trabalho",
  "Transporte",
  "Família",
  "Compromisso pessoal",
  "Chuva/Clima",
  "Outro",
  "Sem justificativa",
] as const;
