import type { ConsentArea } from "@/hooks/usePrivacyConsent";
import { loadStoredPrivacyConsent } from "@/lib/privacyConsentStorage";
import { persistPrivacyConsentToBackend } from "@/lib/persistPrivacyConsent";

/** Reenvia prefs do localStorage ao servidor (pós-login ou pós-cadastro com sessão). */
export async function syncStoredPrivacyConsentAfterAuth(options?: {
  consentArea?: ConsentArea;
  source?: string;
}): Promise<void> {
  const prefs = loadStoredPrivacyConsent();
  if (!prefs) return;
  try {
    await persistPrivacyConsentToBackend(prefs, {
      consentArea: options?.consentArea ?? "general",
      source: options?.source ?? "post_auth_sync",
    });
  } catch (error) {
    console.warn("[LGPD] Falha ao sincronizar consentimento pós-autenticação:", error);
  }
}
