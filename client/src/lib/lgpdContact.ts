/** Canal de direitos do titular — atendimento LGPD via marketing. */
export const LGPD_CONTACT_EMAIL = "marketing@institutoogrito.org";

const DEFAULT_BODY = `Olá,

Gostaria de fazer uma solicitação sobre meus dados pessoais (exclusão, correção, acesso ou outra).

Nome completo:
E-mail da conta:
Tipo de pedido:

Descrição:
`;

export function buildLgpdMailto(
  subject = "Solicitação LGPD — Meus dados",
  body = DEFAULT_BODY
): string {
  return `mailto:${LGPD_CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
