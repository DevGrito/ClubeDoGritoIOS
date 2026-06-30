/** Versões vigentes das políticas — ao alterar, usuários devem reconsentir. */
export const LGPD_POLICY_VERSIONS = {
  consent: "1.0",
  privacy: "1.0",
  cookie: "1.0",
  terms: "1.0",
  image: "1.0",
} as const;

export type LgpdConsentFlags = {
  consent_area: string;
  consent_version: string;
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

export function getPolicyBundleId(): string {
  return Object.entries(LGPD_POLICY_VERSIONS)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
}

/** Payload canônico para hash/HMAC (ordem estável de chaves). */
export function buildCanonicalConsentPayload(flags: LgpdConsentFlags): string {
  const ordered: Record<string, string | boolean> = {
    analytics: !!flags.analytics,
    communications: !!flags.communications,
    consent_area: flags.consent_area,
    consent_version: flags.consent_version || LGPD_POLICY_VERSIONS.consent,
    cookie_policy_version: flags.cookie_policy_version || LGPD_POLICY_VERSIONS.cookie,
    functional: !!flags.functional,
    image_policy_version: flags.image_policy_version || LGPD_POLICY_VERSIONS.image,
    image_use: !!flags.image_use,
    marketing: !!flags.marketing,
    necessary: flags.necessary !== false,
    privacy_policy_version: flags.privacy_policy_version || LGPD_POLICY_VERSIONS.privacy,
    terms_version: flags.terms_version || LGPD_POLICY_VERSIONS.terms,
  };
  return JSON.stringify(ordered);
}
