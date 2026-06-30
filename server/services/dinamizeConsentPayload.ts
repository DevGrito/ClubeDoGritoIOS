export type DinamizeSyncIntent =
  | "billing"
  | "subscription_status"
  | "consent_update"
  | "prize_fulfillment"
  | "manual";

export type DinamizeConsentSnapshot = {
  marketing: boolean;
  communications: boolean;
  consentKnown: boolean;
  consentVersion: string;
  consentUpdatedAt: string | null;
  consentSource: string;
};

/** Default deny — ausência de consentimento não é aceite. */
export const DEFAULT_DENY_CONSENT_SNAPSHOT: DinamizeConsentSnapshot = {
  marketing: false,
  communications: false,
  consentKnown: false,
  consentVersion: "unknown",
  consentUpdatedAt: null,
  consentSource: "none",
};

export function isDinamizeLgpdPayloadEnabled(): boolean {
  return process.env.DINAMIZE_LGPD_PAYLOAD !== "0";
}

export function buildLgpdDinamizePayloadFields(
  snapshot: DinamizeConsentSnapshot,
  syncIntent: DinamizeSyncIntent
): Record<string, unknown> {
  const { marketing, communications } = snapshot;
  return {
    sync_intent: syncIntent,
    optin_communications: communications,
    optin_marketing: marketing,
    optin_email: communications,
    optin_whatsapp: communications,
    optin_sms: communications,
    allow_marketing_campaigns: marketing,
    allow_relationship_campaigns: communications,
    allow_promotional_email: marketing,
    marketing_automation_blocked: !marketing && !communications,
    lgpd_consent_known: snapshot.consentKnown,
    lgpd_consent_version: snapshot.consentVersion,
    lgpd_consent_updated_at: snapshot.consentUpdatedAt,
    lgpd_consent_source: snapshot.consentSource,
  };
}

export function logDinamizeConsentLine(
  context: string,
  userId: number | null,
  syncIntent: DinamizeSyncIntent,
  snapshot: DinamizeConsentSnapshot
): void {
  console.log(
    `[DINAMIZE] ${context} userId=${userId ?? "n/a"} intent=${syncIntent} ` +
      `optin_comm=${snapshot.communications} optin_mkt=${snapshot.marketing} ` +
      `consent_known=${snapshot.consentKnown} source=${snapshot.consentSource}`
  );
}
