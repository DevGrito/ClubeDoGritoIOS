import {
  type SituacaoFormacao,
  SITUACAO_FORMACAO_BADGE_CLASS,
  SITUACAO_FORMACAO_LABEL,
} from "@/lib/turmaSituacaoAluno";

export function SituacaoFormacaoBadge({ situacao }: { situacao: SituacaoFormacao }) {
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block ${SITUACAO_FORMACAO_BADGE_CLASS[situacao]}`}
    >
      {SITUACAO_FORMACAO_LABEL[situacao]}
    </span>
  );
}
