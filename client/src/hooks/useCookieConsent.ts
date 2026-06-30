import { useState, useCallback, useEffect, useMemo } from "react";
import { CONSENT_UPDATED_EVENT, dispatchConsentUpdated } from "@/lib/consentManager";
import { persistPrivacyConsentToBackend } from "@/lib/persistPrivacyConsent";
import { reportConsentSyncError } from "@/lib/reportConsentSyncError";
import {
  loadAnalyticsScripts,
  loadMarketingScripts,
  loadFunctionalScripts,
  syncAllConsentScripts,
} from "@/lib/consentScriptLoader";
import {
  PRIVACY_CONSENT_VERSION,
  getCurrentPolicyBundleId,
  loadStoredPrivacyConsent,
  saveStoredPrivacyConsent,
  markPrivacyConsentPendingSync,
  isPrivacyConsentPendingSync,
  needsPolicyReconsent,
  isLgpdLocalStorageKey,
  type StoredPrivacyConsent,
} from "@/lib/privacyConsentStorage";

export const COOKIE_CONSENT_VERSION = PRIVACY_CONSENT_VERSION;

export type CookieConsent = StoredPrivacyConsent;

export { loadAnalyticsScripts, loadMarketingScripts, loadFunctionalScripts };

function buildConsent(
  partial: Partial<
    Pick<
      StoredPrivacyConsent,
      "analytics" | "functional" | "marketing" | "imageUse" | "communications"
    >
  >
): StoredPrivacyConsent {
  const now = new Date().toISOString();
  const existing = loadStoredPrivacyConsent();
  return {
    version: PRIVACY_CONSENT_VERSION,
    policyBundleId: getCurrentPolicyBundleId(),
    necessary: true,
    analytics: partial.analytics ?? existing?.analytics ?? false,
    functional: partial.functional ?? existing?.functional ?? false,
    marketing: partial.marketing ?? existing?.marketing ?? false,
    imageUse: partial.imageUse ?? existing?.imageUse ?? false,
    communications: partial.communications ?? existing?.communications ?? false,
    acceptedAt: existing?.acceptedAt || now,
    updatedAt: now,
  };
}

export function shouldShowCookieConsentBanner(stored: StoredPrivacyConsent | null): boolean {
  return !stored || needsPolicyReconsent(stored);
}

export function useCookieConsent() {
  const [consent, setConsent] = useState<StoredPrivacyConsent | null>(() => loadStoredPrivacyConsent());
  const [showPreferences, setShowPreferences] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [pendingSync, setPendingSync] = useState(isPrivacyConsentPendingSync);

  const syncFromStorage = useCallback(() => {
    setConsent(loadStoredPrivacyConsent());
  }, []);

  useEffect(() => {
    const onConsentUpdated = () => syncFromStorage();
    const onStorage = (event: StorageEvent) => {
      if (event.key !== null && !isLgpdLocalStorageKey(event.key)) return;
      syncFromStorage();
    };

    window.addEventListener(CONSENT_UPDATED_EVENT, onConsentUpdated);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CONSENT_UPDATED_EVENT, onConsentUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [syncFromStorage]);

  const needsBanner = useMemo(() => shouldShowCookieConsentBanner(consent), [consent]);

  const persist = useCallback(async (c: StoredPrivacyConsent) => {
    await persistPrivacyConsentToBackend(c, { consentArea: "general", source: "web_banner" });
    setSyncError(null);
    setPendingSync(false);
    markPrivacyConsentPendingSync(false);
  }, []);

  useEffect(() => {
    if (!pendingSync || !consent) return;
    const delayMs = Math.min(60000, Math.pow(2, retryAttempt) * 1000);
    const timer = window.setTimeout(async () => {
      try {
        await persist(consent);
        setRetryAttempt(0);
      } catch (error) {
        console.error("[LGPD] Retry de consentimento falhou:", error);
        setRetryAttempt((prev) => prev + 1);
      }
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [pendingSync, consent, retryAttempt, persist]);

  const onPersistError = useCallback((error: unknown) => {
    console.error("[LGPD] Erro ao salvar consentimento:", error);
    const msg = error instanceof Error ? error.message : "erro desconhecido";
    const statusMatch = msg.match(/HTTP (\d{3})/);
    const httpStatus = statusMatch ? Number(statusMatch[1]) : undefined;
    void reportConsentSyncError({ message: msg, httpStatus, source: "web_banner" });
    setSyncError(`Não foi possível sincronizar agora (${msg}). Tentaremos novamente.`);
    setPendingSync(true);
    setRetryAttempt(0);
    markPrivacyConsentPendingSync(true);
  }, []);

  const applyConsent = useCallback((c: StoredPrivacyConsent) => {
    saveStoredPrivacyConsent(c);
    dispatchConsentUpdated();
    setConsent(c);
  }, []);

  const acceptAll = useCallback(async () => {
    const c = buildConsent({
      analytics: true,
      functional: true,
      marketing: true,
      imageUse: true,
      communications: true,
    });
    try {
      applyConsent(c);
    } catch (error) {
      console.error("[LGPD] Não foi possível persistir consentimento localmente:", error);
      return;
    }
    try {
      await persist(c);
    } catch (e) {
      onPersistError(e);
    }
    syncAllConsentScripts();
  }, [applyConsent, persist, onPersistError]);

  const rejectAll = useCallback(async () => {
    const c = buildConsent({
      analytics: false,
      functional: false,
      marketing: false,
      imageUse: false,
      communications: false,
    });
    try {
      applyConsent(c);
    } catch (error) {
      console.error("[LGPD] Não foi possível persistir consentimento localmente:", error);
      return;
    }
    try {
      await persist(c);
    } catch (e) {
      onPersistError(e);
    }
  }, [applyConsent, persist, onPersistError]);

  const savePreferences = useCallback(
    async (
      prefs: Partial<
        Pick<
          StoredPrivacyConsent,
          "analytics" | "functional" | "marketing" | "imageUse" | "communications"
        >
      >
    ) => {
      const c = buildConsent({
        analytics: prefs.analytics,
        functional: prefs.functional,
        marketing: prefs.marketing,
        imageUse: prefs.imageUse ?? false,
        communications: prefs.communications ?? false,
      });
      try {
        applyConsent(c);
      } catch (error) {
        console.error("[LGPD] Não foi possível persistir consentimento localmente:", error);
        return;
      }
      try {
        await persist(c);
      } catch (e) {
        onPersistError(e);
      }
      setShowPreferences(false);
      syncAllConsentScripts();
    },
    [applyConsent, persist, onPersistError]
  );

  const openPreferences = useCallback(() => setShowPreferences(true), []);
  const closePreferences = useCallback(() => setShowPreferences(false), []);

  return {
    consent,
    syncError,
    pendingSync,
    needsBanner,
    showPreferences,
    acceptAll,
    rejectAll,
    savePreferences,
    openPreferences,
    closePreferences,
  };
}
