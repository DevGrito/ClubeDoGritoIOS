// Catálogo configurável de deep links por banco.
// Alguns bancos aceitam o genérico br.gov.bcb.pix://<payload>. Outros possuem esquemas próprios.
// Mantenha isso em config para evoluir sem mexer no código de UI.
export type Bank = {
  id: string;
  name: string;
  linkBuilder: (payloadEmv: string) => string;
};

// Comece com o genérico e ajuste ao aprender os esquemas dos parceiros.
// (Ex.: alguns apps aceitam parâmetros próprios; se não souber, caia no genérico).
export const BANKS: Bank[] = [
  {
    id: "generic",
    name: "PIX genérico (qualquer banco)",
    linkBuilder: (p) => `br.gov.bcb.pix://${encodeURIComponent(p)}`,
  },
  {
    id: "nubank",
    name: "Nubank",
    linkBuilder: (p) => `br.gov.bcb.pix://${encodeURIComponent(p)}`,
  },
  {
    id: "itau",
    name: "Itaú",
    linkBuilder: (p) => `br.gov.bcb.pix://${encodeURIComponent(p)}`,
  },
  {
    id: "inter",
    name: "Banco Inter",
    linkBuilder: (p) => `br.gov.bcb.pix://${encodeURIComponent(p)}`,
  },
  {
    id: "picpay",
    name: "PicPay",
    linkBuilder: (p) => `br.gov.bcb.pix://${encodeURIComponent(p)}`,
  },
  {
    id: "bradesco",
    name: "Bradesco",
    linkBuilder: (p) => `br.gov.bcb.pix://${encodeURIComponent(p)}`,
  },
  {
    id: "caixa",
    name: "Caixa Econômica",
    linkBuilder: (p) => `br.gov.bcb.pix://${encodeURIComponent(p)}`,
  },
  {
    id: "santander",
    name: "Santander",
    linkBuilder: (p) => `br.gov.bcb.pix://${encodeURIComponent(p)}`,
  },
];