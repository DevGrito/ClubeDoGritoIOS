import { hasConsent, runWithConsent } from "./consentManager";

export async function marketingFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  onBlocked?: () => void
) {
  return runWithConsent(
    "marketing",
    async () => fetch(input, init),
    onBlocked
  );
}

export function getReferralCodeIfConsented(): string {
  if (!hasConsent("marketing")) return "";
  return localStorage.getItem("referralCode") || "";
}
