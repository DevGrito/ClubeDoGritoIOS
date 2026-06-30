import { describe, expect, it } from "vitest";
import {
  buildCanonicalConsentPayload,
  getPolicyBundleId,
  LGPD_POLICY_VERSIONS,
} from "./lgpdPolicyVersions";

describe("lgpdPolicyVersions", () => {
  it("gera bundle id estável", () => {
    expect(getPolicyBundleId()).toContain(`privacy:${LGPD_POLICY_VERSIONS.privacy}`);
    expect(getPolicyBundleId()).toBe(getPolicyBundleId());
  });

  it("payload canônico é determinístico", () => {
    const input = {
      consent_area: "general",
      consent_version: "1.0",
      privacy_policy_version: "1.0",
      cookie_policy_version: "1.0",
      terms_version: "1.0",
      image_policy_version: "1.0",
      necessary: true,
      analytics: true,
      functional: false,
      marketing: true,
      image_use: false,
      communications: true,
    };
    expect(buildCanonicalConsentPayload(input)).toBe(buildCanonicalConsentPayload(input));
  });
});
