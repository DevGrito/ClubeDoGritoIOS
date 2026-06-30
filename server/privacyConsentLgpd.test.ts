import { describe, expect, it } from "vitest";
import { computeServerConsentIntegrity } from "./privacyConsentLgpd";

describe("privacyConsentLgpd", () => {
  it("gera policyHash e HMAC determinísticos", () => {
    const flags = {
      consent_area: "general",
      consent_version: "1.0",
      privacy_policy_version: "1.0",
      cookie_policy_version: "1.0",
      terms_version: "1.0",
      image_policy_version: "1.0",
      necessary: true,
      analytics: false,
      functional: false,
      marketing: true,
      image_use: false,
      communications: false,
    };

    const a = computeServerConsentIntegrity(flags);
    const b = computeServerConsentIntegrity(flags);

    expect(a.policyHash).toBe(b.policyHash);
    expect(a.consentHmac).toBe(b.consentHmac);
    expect(a.policyHash).toHaveLength(64);
    expect(a.consentHmac).toHaveLength(64);
  });

  it("HMAC muda quando preferências mudam", () => {
    const base = {
      consent_area: "general",
      consent_version: "1.0",
      privacy_policy_version: "1.0",
      cookie_policy_version: "1.0",
      terms_version: "1.0",
      image_policy_version: "1.0",
      necessary: true,
      analytics: false,
      functional: false,
      marketing: false,
      image_use: false,
      communications: false,
    };
    const off = computeServerConsentIntegrity(base);
    const on = computeServerConsentIntegrity({ ...base, marketing: true });
    expect(off.consentHmac).not.toBe(on.consentHmac);
  });
});
