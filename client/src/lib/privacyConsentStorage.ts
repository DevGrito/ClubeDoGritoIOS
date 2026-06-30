import { getPolicyBundleId, LGPD_POLICY_VERSIONS } from "@shared/lgpdPolicyVersions";

/** Chave unificada de consentimento no navegador */
export const PRIVACY_CONSENT_STORAGE_KEY = "clube_grito_privacy_consent";
export const ANONYMOUS_CONSENT_ID_KEY = "clube_grito_anonymous_consent_id";
export const PENDING_SYNC_KEY = "clube_grito_privacy_consent_pending_sync";

const LEGACY_COOKIE_KEY = "clube_grito_cookie_consent";
const LEGACY_PREFS_KEY = "clube_grito_privacy_preferences";

/** Chaves de consentimento LGPD que devem sobreviver a logout/login. */
export const LGPD_LOCAL_STORAGE_KEYS = [
  PRIVACY_CONSENT_STORAGE_KEY,
  ANONYMOUS_CONSENT_ID_KEY,
  PENDING_SYNC_KEY,
  LEGACY_COOKIE_KEY,
  LEGACY_PREFS_KEY,
] as const;

export type LgpdLocalStorageKey = (typeof LGPD_LOCAL_STORAGE_KEYS)[number];

export function isLgpdLocalStorageKey(key: string | null): key is LgpdLocalStorageKey {
  if (!key) return false;
  return (LGPD_LOCAL_STORAGE_KEYS as readonly string[]).includes(key);
}

export function snapshotLgpdLocalStorage(): Partial<Record<LgpdLocalStorageKey, string>> {
  const snapshot: Partial<Record<LgpdLocalStorageKey, string>> = {};
  for (const key of LGPD_LOCAL_STORAGE_KEYS) {
    const value = localStorage.getItem(key);
    if (value !== null) snapshot[key] = value;
  }
  return snapshot;
}

export function restoreLgpdLocalStorage(snapshot: Partial<Record<LgpdLocalStorageKey, string>>) {
  for (const key of LGPD_LOCAL_STORAGE_KEYS) {
    const value = snapshot[key];
    if (value === undefined) continue;
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error("[LGPD] Falha ao restaurar chave no localStorage:", key, error);
    }
  }
}

/** Limpa localStorage inteiro, preservando consentimento LGPD/cookies. */
export function clearLocalStoragePreservingLgpd() {
  const lgpdSnapshot = snapshotLgpdLocalStorage();
  localStorage.clear();
  restoreLgpdLocalStorage(lgpdSnapshot);
}

export const PRIVACY_CONSENT_VERSION = LGPD_POLICY_VERSIONS.consent;

export interface StoredPrivacyConsent {
  version: string;
  policyBundleId: string;
  necessary: boolean;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  imageUse: boolean;
  communications: boolean;
  acceptedAt: string;
  updatedAt: string;
}

export function getCurrentPolicyBundleId(): string {
  return getPolicyBundleId();
}

export function needsPolicyReconsent(consent: StoredPrivacyConsent | null): boolean {
  if (!consent) return true;
  return consent.policyBundleId !== getCurrentPolicyBundleId();
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function normalizeStored(raw: Partial<StoredPrivacyConsent> | null): StoredPrivacyConsent | null {
  if (!raw) return null;
  if (raw.version && raw.version !== PRIVACY_CONSENT_VERSION) return null;
  const policyBundleId = raw.policyBundleId || getCurrentPolicyBundleId();
  return {
    version: PRIVACY_CONSENT_VERSION,
    policyBundleId,
    necessary: raw.necessary !== false,
    analytics: !!raw.analytics,
    functional: !!raw.functional,
    marketing: !!raw.marketing,
    imageUse: !!raw.imageUse,
    communications: !!raw.communications,
    acceptedAt: raw.acceptedAt || raw.updatedAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.acceptedAt || new Date().toISOString(),
  };
}

/** Lê consentimento unificado (migra chaves legadas automaticamente). */
export function loadStoredPrivacyConsent(): StoredPrivacyConsent | null {
  const primary = normalizeStored(parseJson<StoredPrivacyConsent>(localStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY)));
  if (primary) return primary;

  const fromCookie = normalizeStored(parseJson<StoredPrivacyConsent>(localStorage.getItem(LEGACY_COOKIE_KEY)));
  if (fromCookie) {
    saveStoredPrivacyConsent(fromCookie);
    return fromCookie;
  }

  const fromPrefs = normalizeStored(parseJson<StoredPrivacyConsent>(localStorage.getItem(LEGACY_PREFS_KEY)));
  if (fromPrefs) {
    saveStoredPrivacyConsent(fromPrefs);
    return fromPrefs;
  }

  return null;
}

export function saveStoredPrivacyConsent(consent: StoredPrivacyConsent) {
  const payload = JSON.stringify(consent);
  for (const key of [PRIVACY_CONSENT_STORAGE_KEY, LEGACY_COOKIE_KEY, LEGACY_PREFS_KEY] as const) {
    try {
      localStorage.setItem(key, payload);
    } catch (error) {
      console.error("[LGPD] Falha ao salvar consentimento no localStorage:", key, error);
      throw error;
    }
  }
}

export function getAnonymousConsentId(): string | null {
  try {
    const existing = localStorage.getItem(ANONYMOUS_CONSENT_ID_KEY);
    if (existing) return existing;
    const generated =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(ANONYMOUS_CONSENT_ID_KEY, generated);
    return generated;
  } catch {
    return null;
  }
}

export function markPrivacyConsentPendingSync(pending: boolean) {
  try {
    if (pending) localStorage.setItem(PENDING_SYNC_KEY, "1");
    else localStorage.removeItem(PENDING_SYNC_KEY);
  } catch {}
}

export function isPrivacyConsentPendingSync(): boolean {
  try {
    return localStorage.getItem(PENDING_SYNC_KEY) === "1";
  } catch {
    return false;
  }
}
