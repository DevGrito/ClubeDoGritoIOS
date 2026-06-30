import { loadStoredPrivacyConsent, type StoredPrivacyConsent } from "@/lib/privacyConsentStorage";

export type ConsentCategory =
  | "necessary"
  | "analytics"
  | "functional"
  | "marketing"
  | "imageUse"
  | "communications";

export const CONSENT_UPDATED_EVENT = "privacy-consent-updated";

export function getConsentSnapshot(): Required<
  Pick<
    StoredPrivacyConsent,
    "necessary" | "analytics" | "functional" | "marketing" | "imageUse" | "communications"
  >
> {
  const source = loadStoredPrivacyConsent();
  return {
    necessary: source?.necessary !== false,
    analytics: !!source?.analytics,
    functional: !!source?.functional,
    marketing: !!source?.marketing,
    imageUse: !!source?.imageUse,
    communications: !!source?.communications,
  };
}

export function hasConsent(category: ConsentCategory): boolean {
  const consent = getConsentSnapshot();
  return consent[category];
}

export function dispatchConsentUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONSENT_UPDATED_EVENT, { detail: getConsentSnapshot() }));
}

export async function runWithConsent<T>(
  category: ConsentCategory,
  task: () => Promise<T> | T,
  onBlocked?: () => void
): Promise<T | null> {
  if (!hasConsent(category)) {
    onBlocked?.();
    return null;
  }
  return await task();
}

/** Abre o modal de preferências de qualquer tela */
export function openPrivacyPreferences() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("openCookiePreferences"));
}
