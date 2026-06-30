export const LEGACY_CONSENT_TYPES = [
  "email_marketing",
  "push_notifications",
  "sms_contact",
  "data_analytics",
  "third_party_share",
] as const;

export type LegacyConsentType = (typeof LEGACY_CONSENT_TYPES)[number];

export type PrivacyConsentFlags = {
  necessary: boolean;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
  image_use: boolean;
  communications: boolean;
};

export type LegacyConsentRow = {
  consent_type: string;
  granted: boolean;
  version: string;
  granted_at: string | null;
  revoked_at: string | null;
};

export function derivePrivacyFlagsFromLegacyRows(
  rows: Array<{ consent_type: string; granted: boolean }>,
  base?: Partial<PrivacyConsentFlags>
): PrivacyConsentFlags {
  const map = Object.fromEntries(rows.map((r) => [r.consent_type, r.granted]));
  return {
    necessary: base?.necessary !== false,
    analytics: map.data_analytics ?? base?.analytics ?? false,
    functional: base?.functional ?? false,
    marketing:
      map.email_marketing !== undefined || map.third_party_share !== undefined
        ? !!(map.email_marketing || map.third_party_share)
        : (base?.marketing ?? false),
    image_use: base?.image_use ?? false,
    communications:
      map.sms_contact !== undefined || map.push_notifications !== undefined
        ? !!(map.sms_contact || map.push_notifications)
        : (base?.communications ?? false),
  };
}

export function legacyRowsFromPrivacyFlags(flags: PrivacyConsentFlags): LegacyConsentRow[] {
  const now = new Date().toISOString();
  const mk = (consent_type: LegacyConsentType, granted: boolean): LegacyConsentRow => ({
    consent_type,
    granted,
    version: "1.0.0",
    granted_at: granted ? now : null,
    revoked_at: granted ? null : now,
  });

  return [
    mk("data_analytics", flags.analytics),
    mk("email_marketing", flags.marketing),
    mk("third_party_share", flags.marketing),
    mk("sms_contact", flags.communications),
    mk("push_notifications", flags.communications),
  ];
}
