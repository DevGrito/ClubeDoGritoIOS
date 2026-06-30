/**
 * Mapa de cobertura LGPD por rota (consentimento / gate / base legal).
 * Referência para auditoria — não substitui ROPA nem parecer jurídico.
 */

export type LgpdRouteCoverageStatus = "covered" | "partial" | "gap" | "n/a";

export type LgpdLegalBasis =
  | "consentimento"
  | "contrato"
  | "legitimo_interesse"
  | "obrigacao_legal"
  | "politica_publica"
  | "none";

export type LgpdAreaGate = "employees" | "students" | "council" | "sponsors" | "donors";

export type LgpdRouteEntry = {
  path: string;
  label: string;
  /** none = só agregados; low = contato operacional; high = dados pessoais sensíveis ou de alunos */
  piiLevel: "none" | "low" | "high";
  termosGuard: boolean;
  areaGate: LgpdAreaGate | null;
  status: LgpdRouteCoverageStatus;
  legalBasis: LgpdLegalBasis;
  notes: string;
};

export const LGPD_ROUTE_COVERAGE: LgpdRouteEntry[] = [
  {
    path: "/professor/*",
    label: "Professor (PEC / Inclusão / Psico)",
    piiLevel: "high",
    termosGuard: true,
    areaGate: "employees",
    status: "covered",
    legalBasis: "consentimento",
    notes: "TermosGuard + AreaConsentGate employees; staff_area_consents na ficha.",
  },
  {
    path: "/monitor/*",
    label: "Monitor",
    piiLevel: "high",
    termosGuard: true,
    areaGate: "employees",
    status: "covered",
    legalBasis: "consentimento",
    notes: "Idem professor.",
  },
  {
    path: "/coordenador/*",
    label: "Coordenadores (PEC, Inclusão, Psico, Negócios, Almoxarifado)",
    piiLevel: "high",
    termosGuard: true,
    areaGate: "employees",
    status: "covered",
    legalBasis: "consentimento",
    notes: "Negócios/Almoxarifado: indicadores agregados, mas gate employees alinhado ao perfil staff.",
  },
  {
    path: "/tecnica/psico",
    label: "Técnica psicossocial",
    piiLevel: "high",
    termosGuard: true,
    areaGate: "employees",
    status: "covered",
    legalBasis: "consentimento",
    notes: "Acesso a atendimentos e dados sensíveis.",
  },
  {
    path: "/aluno",
    label: "Portal do aluno",
    piiLevel: "high",
    termosGuard: true,
    areaGate: "students",
    status: "covered",
    legalBasis: "consentimento",
    notes: "AlunoTermosGuard + gate students; menores com fluxo de responsável.",
  },
  {
    path: "/conselho",
    label: "Conselho",
    piiLevel: "high",
    termosGuard: true,
    areaGate: "council",
    status: "covered",
    legalBasis: "consentimento",
    notes: "Gate council + termos.",
  },
  {
    path: "/patrocinador-dashboard",
    label: "Patrocinador",
    piiLevel: "low",
    termosGuard: true,
    areaGate: "sponsors",
    status: "covered",
    legalBasis: "consentimento",
    notes: "Relatórios agregados; representante com gate sponsors.",
  },
  {
    path: "/tdoador",
    label: "Doador (welcome)",
    piiLevel: "low",
    termosGuard: true,
    areaGate: "donors",
    status: "covered",
    legalBasis: "consentimento",
    notes: "Gate donors no fluxo pós-cadastro.",
  },
  {
    path: "/admin-geral",
    label: "Admin geral",
    piiLevel: "high",
    termosGuard: true,
    areaGate: null,
    status: "partial",
    legalBasis: "obrigacao_legal",
    notes: "Termos sim; sem AreaConsentGate employees. Acesso amplo a CRM/doadores — avaliar gate ou política interna.",
  },
  {
    path: "/administrador",
    label: "Leo Martins (super admin)",
    piiLevel: "high",
    termosGuard: true,
    areaGate: null,
    status: "partial",
    legalBasis: "obrigacao_legal",
    notes: "Termos sim; sem gate por área. Controle por papel super_admin.",
  },
  {
    path: "/confeccao",
    label: "Confecção (orçamentos)",
    piiLevel: "high",
    termosGuard: false,
    areaGate: null,
    status: "gap",
    legalBasis: "contrato",
    notes: "Nome/documento de clientes; rota pública sem login LGPD. APIs sem auth — prioridade alta.",
  },
  {
    path: "/vendedor/outlet",
    label: "Vendedor outlet",
    piiLevel: "low",
    termosGuard: false,
    areaGate: null,
    status: "partial",
    legalBasis: "legitimo_interesse",
    notes: "Vendas agregadas; rota pública. Termos recomendados se identificar operador.",
  },
  {
    path: "/coordenador/negocios-sociais",
    label: "Coord. negócios (indicadores)",
    piiLevel: "none",
    termosGuard: true,
    areaGate: "employees",
    status: "covered",
    legalBasis: "consentimento",
    notes: "Somente KPIs agregados; gates por alinhamento ao perfil staff.",
  },
  {
    path: "/coordenador/almoxarifado",
    label: "Coord. almoxarifado (indicadores)",
    piiLevel: "none",
    termosGuard: true,
    areaGate: "employees",
    status: "covered",
    legalBasis: "consentimento",
    notes: "Idem negócios sociais.",
  },
  {
    path: "/dev",
    label: "Painel desenvolvedor",
    piiLevel: "high",
    termosGuard: true,
    areaGate: null,
    status: "partial",
    legalBasis: "obrigacao_legal",
    notes: "Lista usuários consolidados; bypass dev no TermosGuard. Restrito a papel dev.",
  },
  {
    path: "/",
    label: "Planos / cadastro público",
    piiLevel: "low",
    termosGuard: false,
    areaGate: null,
    status: "n/a",
    legalBasis: "consentimento",
    notes: "Banner de cookies + termos no fluxo de cadastro/doação.",
  },
];

export function lgpdRouteGaps(): LgpdRouteEntry[] {
  return LGPD_ROUTE_COVERAGE.filter((r) => r.status === "gap" || r.status === "partial");
}

export function lgpdRouteCoverageSummary(): {
  covered: number;
  partial: number;
  gap: number;
  total: number;
} {
  const covered = LGPD_ROUTE_COVERAGE.filter((r) => r.status === "covered").length;
  const partial = LGPD_ROUTE_COVERAGE.filter((r) => r.status === "partial").length;
  const gap = LGPD_ROUTE_COVERAGE.filter((r) => r.status === "gap").length;
  return { covered, partial, gap, total: LGPD_ROUTE_COVERAGE.length };
}
