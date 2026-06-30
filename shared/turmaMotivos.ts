/** Motivos de desligamento (remoção de vínculo — não conta como evasão). */
export const DESLIGAMENTO_MOTIVOS = [
  "Cadastro errado",
  "Empregabilidade",
  "Mudança de localidade",
  "Mudança de oficina/curso",
] as const;

export type DesligamentoMotivo = (typeof DESLIGAMENTO_MOTIVOS)[number];

export const TRANSICAO_PEC_MOTIVO = "Transição para Inclusão Produtiva";

export function isDesligamentoMotivoValido(motivo: string): motivo is DesligamentoMotivo {
  return (DESLIGAMENTO_MOTIVOS as readonly string[]).includes(motivo);
}
