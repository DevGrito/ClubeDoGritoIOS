import { useState, useCallback, useEffect } from "react";
import { CONSENT_UPDATED_EVENT, dispatchConsentUpdated } from "@/lib/consentManager";
import { persistPrivacyConsentToBackend } from "@/lib/persistPrivacyConsent";
import {
  PRIVACY_CONSENT_VERSION,
  getCurrentPolicyBundleId,
  loadStoredPrivacyConsent,
  saveStoredPrivacyConsent,
  markPrivacyConsentPendingSync,
  isPrivacyConsentPendingSync,
  needsPolicyReconsent as checkPolicyReconsent,
  isLgpdLocalStorageKey,
  type StoredPrivacyConsent,
} from "@/lib/privacyConsentStorage";
import { reportConsentSyncError } from "@/lib/reportConsentSyncError";
import { LGPD_POLICY_VERSIONS } from "@shared/lgpdPolicyVersions";

export const PRIVACY_POLICY_VERSION = LGPD_POLICY_VERSIONS.privacy;
export const COOKIE_POLICY_VERSION = LGPD_POLICY_VERSIONS.cookie;
export const TERMS_VERSION = LGPD_POLICY_VERSIONS.terms;
export const IMAGE_POLICY_VERSION = LGPD_POLICY_VERSIONS.image;

export type ConsentArea =
  | "institutional_site"
  | "events"
  | "students"
  | "employees"
  | "sponsors"
  | "council"
  | "donors"
  | "general";

export type PrivacyPreferences = StoredPrivacyConsent;

type PolicyHashInput = {
  consent_area: string;
  consent_version?: string;
  privacy_policy_version: string;
  cookie_policy_version: string;
  terms_version: string;
  image_policy_version: string;
  necessary: boolean;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  image_use: boolean;
  communications: boolean;
};

export function computePolicyHash(input: PolicyHashInput): string {
  const serialized = JSON.stringify(input);
  let hash = 2166136261;
  for (let i = 0; i < serialized.length; i++) {
    hash ^= serialized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a-${(hash >>> 0).toString(16)}`;
}

export async function savePrivacyConsent(params: {
  consentArea: ConsentArea;
  preferences: Partial<PrivacyPreferences>;
  source?: string;
}): Promise<PrivacyPreferences> {
  const now = new Date().toISOString();
  const existing = loadStoredPrivacyConsent();
  const merged: PrivacyPreferences = {
    version: PRIVACY_CONSENT_VERSION,
    policyBundleId: getCurrentPolicyBundleId(),
    necessary: true,
    analytics: params.preferences.analytics ?? existing?.analytics ?? false,
    functional: params.preferences.functional ?? existing?.functional ?? false,
    marketing: params.preferences.marketing ?? existing?.marketing ?? false,
    imageUse: params.preferences.imageUse ?? existing?.imageUse ?? false,
    communications: params.preferences.communications ?? existing?.communications ?? false,
    acceptedAt: existing?.acceptedAt || now,
    updatedAt: now,
  };

  saveStoredPrivacyConsent(merged);
  dispatchConsentUpdated();

  await persistPrivacyConsentToBackend(merged, {
    consentArea: params.consentArea,
    source: params.source || "web",
  });

  return merged;
}

export function usePrivacyConsent(consentArea: ConsentArea) {
  const [preferences, setPreferences] = useState<PrivacyPreferences | null>(() => loadStoredPrivacyConsent());
  const [syncError, setSyncError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [pendingSync, setPendingSync] = useState(isPrivacyConsentPendingSync);

  const syncFromStorage = useCallback(() => {
    setPreferences(loadStoredPrivacyConsent());
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

  const save = useCallback(
    async (prefs: Partial<PrivacyPreferences>, source?: string) => {
      try {
        const result = await savePrivacyConsent({ consentArea, preferences: prefs, source });
        setPreferences(result);
        setSyncError(null);
        setPendingSync(false);
        markPrivacyConsentPendingSync(false);
        return result;
      } catch (error) {
        console.error("[LGPD] Falha ao persistir consentimento:", error);
        const msg = error instanceof Error ? error.message : "erro desconhecido";
        const statusMatch = msg.match(/HTTP (\d{3})/);
        void reportConsentSyncError({
          message: msg,
          httpStatus: statusMatch ? Number(statusMatch[1]) : undefined,
          source: source || "web",
        });
        setSyncError(`Não foi possível sincronizar agora (${msg}). Tentaremos novamente.`);
        setPendingSync(true);
        setRetryAttempt(0);
        markPrivacyConsentPendingSync(true);
        throw error;
      }
    },
    [consentArea]
  );

  useEffect(() => {
    if (!pendingSync || !preferences) return;
    const delayMs = Math.min(60000, Math.pow(2, retryAttempt) * 1000);
    const timer = window.setTimeout(async () => {
      try {
        const result = await savePrivacyConsent({
          consentArea,
          preferences,
          source: "web_retry",
        });
        setPreferences(result);
        setSyncError(null);
        setPendingSync(false);
        setRetryAttempt(0);
        markPrivacyConsentPendingSync(false);
      } catch (error) {
        console.error("[LGPD] Retry de preferências falhou:", error);
        setRetryAttempt((prev) => prev + 1);
      }
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [pendingSync, preferences, retryAttempt, consentArea]);

  const hasConsented = !!preferences;
  const needsNewConsent = checkPolicyReconsent(preferences);

  return { preferences, save, hasConsented, needsNewConsent, syncError, pendingSync };
}
