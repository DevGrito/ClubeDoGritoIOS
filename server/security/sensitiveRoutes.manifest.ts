/** Rotas sensíveis (SEC-003 / SEC-026) — devem ter middleware de auth no handler. */
export type SensitiveRoute = {
  method: string;
  path: string;
  /** Se definido, todos devem aparecer no trecho do handler. */
  requiredMarkers?: string[];
};

export const SENSITIVE_ROUTES: SensitiveRoute[] = [
  { method: "GET", path: "/api/donors/:id/details", requiredMarkers: ["requireAuth", "requireAdmin"] },
  { method: "GET", path: "/api/stripe/donors/deep-analysis", requiredMarkers: ["requireAuth", "requireAdmin"] },
  { method: "GET", path: "/api/donors", requiredMarkers: ["requireAuth", "requireAdmin"] },
  { method: "GET", path: "/api/subscriptions/:id/client-secret", requiredMarkers: ["resolveSubscriptionAccess"] },
  { method: "POST", path: "/api/subscriptions/:id/pay", requiredMarkers: ["resolveSubscriptionAccess"] },
  { method: "GET", path: "/api/subscription/verify", requiredMarkers: ["requireAuth"] },
  { method: "POST", path: "/api/ingressos/reset-usados", requiredMarkers: ["requireAuth", "requireAdmin"] },
  { method: "GET", path: "/api/ingressos/estatisticas", requiredMarkers: ["requireAuth", "requireAdmin"] },
  { method: "GET", path: "/api/ingressos/:id", requiredMarkers: ["requireAuth", "requireAdmin"] },
  { method: "POST", path: "/api/admin/sync-stripe-donors", requiredMarkers: ["requireAuth", "requireAdmin"] },
  { method: "GET", path: "/api/coordenador/professores", requiredMarkers: ["requireAuth", "requireRole"] },
  { method: "POST", path: "/api/coordenador/professores", requiredMarkers: ["requireAuth", "requireRole"] },
  { method: "GET", path: "/api/professor/students/:professorId", requiredMarkers: ["requireAuth"] },
  { method: "POST", path: "/api/pec/import/alunos/preview", requiredMarkers: ["authGuards"] },
  { method: "POST", path: "/api/pec/import/alunos/commit", requiredMarkers: ["authGuards"] },
  { method: "GET", path: "/api/admin/chamadas-auditoria", requiredMarkers: ["requireAuth", "requireChamadasAuditoriaAccess"] },
  { method: "GET", path: "/api/presenca-manual-senha/status", requiredMarkers: ["requireAuth", "requirePresencaManualCoordenadorSenha"] },
  { method: "POST", path: "/api/presenca-manual-senha/definir", requiredMarkers: ["requireAuth", "requirePresencaManualCoordenadorSenha"] },
  { method: "POST", path: "/api/presenca/validar-pin-manual", requiredMarkers: ["requireAuth", "requireValidarPinManualAccess"] },
  { method: "POST", path: "/api/chamada-manual-log", requiredMarkers: ["requireAuth", "requireChamadaManualLogAccess"] },
  { method: "POST", path: "/api/tablet-chamada/login", requiredMarkers: ["passwordLoginLimiter"] },
  { method: "POST", path: "/api/tablet-chamada/validar-senha-manual", requiredMarkers: ["requireTabletChamadaAuth"] },
  { method: "POST", path: "/api/tablet-chamada/logout", requiredMarkers: ["requireTabletChamadaAuth"] },
  { method: "GET", path: "/api/tablet-chamada/turmas", requiredMarkers: ["requireTabletChamadaAuth"] },
  { method: "GET", path: "/api/tablet-chamada/roster", requiredMarkers: ["requireTabletChamadaAuth"] },
  { method: "GET", path: "/api/tablet-chamada/dias-disponiveis", requiredMarkers: ["requireTabletChamadaAuth"] },
  { method: "GET", path: "/api/tablet-chamada/historico", requiredMarkers: ["requireTabletChamadaAuth"] },
  { method: "POST", path: "/api/tablet-chamada/finalizar", requiredMarkers: ["requireTabletChamadaAuth"] },
  { method: "GET", path: "/api/scanner-presenca/fotos", requiredMarkers: ["requireAuth"] },
  { method: "GET", path: "/api/scanner-presenca/presentes", requiredMarkers: ["requireAuth"] },
  { method: "POST", path: "/api/scanner-presenca/registrar", requiredMarkers: ["requireAuth"] },
  { method: "POST", path: "/api/scanner-presenca/desfazer", requiredMarkers: ["requireAuth"] },
];

export const AUTH_MARKERS = [
  "requireAuth",
  "requireRole",
  "requireAdmin",
  "requirePrivacyAuditAccess",
  "requireWebhookSecret",
  "requireTypeformWebhook",
  "requirePortalAuth",
  "requireAlunoPortalSession",
  "requireScannerSession",
  "requireTabletChamadaAuth",
  "requireChamadasAuditoriaAccess",
  "requirePresencaManualCoordenadorSenha",
  "requireValidarPinManualAccess",
  "requireChamadaManualLogAccess",
  "passwordLoginLimiter",
] as const;
