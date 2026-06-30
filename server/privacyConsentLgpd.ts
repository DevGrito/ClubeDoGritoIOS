import crypto from "node:crypto";
import {
  buildCanonicalConsentPayload,
  type LgpdConsentFlags,
} from "../shared/lgpdPolicyVersions";

export function getConsentHmacSecret(): string {
  const secret =
    process.env.PRIVACY_CONSENT_HMAC_SECRET?.trim() ||
    process.env.SESSION_SECRET?.trim() ||
    "";
  if (!secret && process.env.NODE_ENV === "production") {
    console.warn(
      "[LGPD] PRIVACY_CONSENT_HMAC_SECRET não configurado — usando fallback inseguro"
    );
  }
  return secret || "lgpd-dev-insecure-change-me";
}

export function computeServerConsentIntegrity(flags: LgpdConsentFlags) {
  const canonical = buildCanonicalConsentPayload(flags);
  const policyHash = crypto.createHash("sha256").update(canonical).digest("hex");
  const secret = getConsentHmacSecret();
  const consentHmac = crypto.createHmac("sha256", secret).update(policyHash).digest("hex");
  return { canonical, policyHash, consentHmac };
}
