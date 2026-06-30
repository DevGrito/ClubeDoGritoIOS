import { describe, expect, it } from "vitest";
import {
  buildLgpdDinamizePayloadFields,
  DEFAULT_DENY_CONSENT_SNAPSHOT,
  type DinamizeConsentSnapshot,
} from "./dinamizeConsentPayload";

describe("dinamizeConsent", () => {
  it("default deny bloqueia campanhas", () => {
    const fields = buildLgpdDinamizePayloadFields(DEFAULT_DENY_CONSENT_SNAPSHOT, "billing");
    expect(fields.optin_communications).toBe(false);
    expect(fields.optin_marketing).toBe(false);
    expect(fields.allow_marketing_campaigns).toBe(false);
    expect(fields.allow_relationship_campaigns).toBe(false);
    expect(fields.marketing_automation_blocked).toBe(true);
    expect(fields.lgpd_consent_known).toBe(false);
    expect(fields.lgpd_consent_source).toBe("none");
  });

  it("opt-in parcial: communications sem marketing", () => {
    const snapshot: DinamizeConsentSnapshot = {
      marketing: false,
      communications: true,
      consentKnown: true,
      consentVersion: "1.0",
      consentUpdatedAt: "2026-06-01T12:00:00.000Z",
      consentSource: "web_banner",
    };
    const fields = buildLgpdDinamizePayloadFields(snapshot, "consent_update");
    expect(fields.allow_relationship_campaigns).toBe(true);
    expect(fields.allow_marketing_campaigns).toBe(false);
    expect(fields.marketing_automation_blocked).toBe(false);
    expect(fields.sync_intent).toBe("consent_update");
    expect(fields.optin_email).toBe(true);
    expect(fields.allow_promotional_email).toBe(false);
  });

  it("ambos opt-in liberam campanhas de marketing e relacionamento", () => {
    const snapshot: DinamizeConsentSnapshot = {
      marketing: true,
      communications: true,
      consentKnown: true,
      consentVersion: "1.0",
      consentUpdatedAt: "2026-06-01T12:00:00.000Z",
      consentSource: "web_banner",
    };
    const fields = buildLgpdDinamizePayloadFields(snapshot, "billing");
    expect(fields.allow_marketing_campaigns).toBe(true);
    expect(fields.allow_relationship_campaigns).toBe(true);
    expect(fields.marketing_automation_blocked).toBe(false);
  });
});
