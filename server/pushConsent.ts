import type { Pool } from "pg";

export type FcmRecipientRow = {
  token: string;
  nome: string | null;
  user_key: string;
  user_type: string;
};

/**
 * Push é controlado apenas por opt-out do usuário (fcm_tokens.ativo).
 * Consentimento LGPD de privacidade não bloqueia envio de push.
 */
export async function filterFcmTokensByPushConsent(
  _pool: Pool,
  rows: FcmRecipientRow[]
): Promise<{ eligible: FcmRecipientRow[]; blocked: FcmRecipientRow[] }> {
  return { eligible: rows, blocked: [] };
}

/** Normaliza público in-app (UI legada enviava `donors`). */
export function normalizeInAppTargetAudience(audience: unknown): string {
  const a = String(audience || "all").trim();
  if (a === "donors") return "donors_only";
  return a || "all";
}
