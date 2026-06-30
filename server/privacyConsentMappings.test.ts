import { describe, expect, it } from "vitest";
import {
  derivePrivacyFlagsFromLegacyRows,
  legacyRowsFromPrivacyFlags,
  LEGACY_CONSENT_TYPES,
} from "./privacyConsentMappings";

describe("privacyConsentUser", () => {
  it("mapeia flags de privacy para tipos legados", () => {
    const rows = legacyRowsFromPrivacyFlags({
      necessary: true,
      analytics: true,
      functional: false,
      marketing: true,
      image_use: false,
      communications: true,
    });
    expect(rows).toHaveLength(LEGACY_CONSENT_TYPES.length);
    const map = Object.fromEntries(rows.map((r) => [r.consent_type, r.granted]));
    expect(map.data_analytics).toBe(true);
    expect(map.email_marketing).toBe(true);
    expect(map.third_party_share).toBe(true);
    expect(map.sms_contact).toBe(true);
    expect(map.push_notifications).toBe(true);
  });

  it("deriva flags de privacy a partir de user_consents", () => {
    const flags = derivePrivacyFlagsFromLegacyRows([
      { consent_type: "data_analytics", granted: true },
      { consent_type: "email_marketing", granted: false },
      { consent_type: "third_party_share", granted: false },
      { consent_type: "sms_contact", granted: true },
      { consent_type: "push_notifications", granted: false },
    ]);
    expect(flags.analytics).toBe(true);
    expect(flags.marketing).toBe(false);
    expect(flags.communications).toBe(true);
  });

  it("preserva functional/image_use do registro privacy anterior", () => {
    const flags = derivePrivacyFlagsFromLegacyRows(
      [{ consent_type: "data_analytics", granted: true }],
      { functional: true, image_use: true, marketing: false, communications: false }
    );
    expect(flags.functional).toBe(true);
    expect(flags.image_use).toBe(true);
  });
});
