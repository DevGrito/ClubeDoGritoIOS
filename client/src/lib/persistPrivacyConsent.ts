import {
  COOKIE_POLICY_VERSION,
  IMAGE_POLICY_VERSION,
  PRIVACY_POLICY_VERSION,
  TERMS_VERSION,
  computePolicyHash,
} from "@/hooks/usePrivacyConsent";
import { getCurrentPolicyBundleId } from "@/lib/privacyConsentStorage";
import type { ConsentArea } from "@/hooks/usePrivacyConsent";
import {
  getAnonymousConsentId,
  type StoredPrivacyConsent,
} from "@/lib/privacyConsentStorage";
import { getStaffConsentHint } from "@/lib/staffConsentHint";

export async function persistPrivacyConsentToBackend(
  consent: StoredPrivacyConsent,
  options?: { consentArea?: ConsentArea; source?: string }
): Promise<void> {
  const consentArea = options?.consentArea ?? "general";
  const staffHint = getStaffConsentHint(consentArea);
  const response = await fetch("/api/privacy/consent", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      anonymous_consent_id: getAnonymousConsentId(),
      consent_area: consentArea,
      ...(staffHint ? { staff_tipo: staffHint.staff_tipo, staff_id: staffHint.staff_id } : {}),
      consent_version: consent.version,
      policy_bundle_id: consent.policyBundleId || getCurrentPolicyBundleId(),
      privacy_policy_version: PRIVACY_POLICY_VERSION,
      cookie_policy_version: COOKIE_POLICY_VERSION,
      terms_version: TERMS_VERSION,
      image_policy_version: IMAGE_POLICY_VERSION,
      policy_hash: computePolicyHash({
        consent_area: consentArea,
        consent_version: consent.version,
        privacy_policy_version: PRIVACY_POLICY_VERSION,
        cookie_policy_version: COOKIE_POLICY_VERSION,
        terms_version: TERMS_VERSION,
        image_policy_version: IMAGE_POLICY_VERSION,
        necessary: consent.necessary,
        analytics: consent.analytics,
        functional: consent.functional,
        marketing: consent.marketing,
        image_use: consent.imageUse,
        communications: consent.communications,
      }),
      accepted_at_client: consent.updatedAt,
      necessary: consent.necessary,
      analytics: consent.analytics,
      functional: consent.functional,
      marketing: consent.marketing,
      image_use: consent.imageUse,
      communications: consent.communications,
      source: options?.source ?? "web_banner",
    }),
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      if (body?.error) detail = `${detail}: ${body.error}`;
    } catch {}
    throw new Error(detail);
  }
}
