import { beforeEach, describe, expect, it, vi } from "vitest";
import { computePolicyHash } from "@/hooks/usePrivacyConsent";
import { getReferralCodeIfConsented, marketingFetch } from "./marketingFetch";

function createLocalStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

describe("marketingFetch e policy hash", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.stubGlobal("localStorage", createLocalStorageMock());
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });

  it("não executa fetch sem consentimento de marketing", async () => {
    const result = await marketingFetch("/api/mkt/active-campaign");
    expect(result).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("executa fetch com consentimento de marketing", async () => {
    localStorage.setItem(
      "clube_grito_cookie_consent",
      JSON.stringify({ necessary: true, marketing: true })
    );

    const result = await marketingFetch("/api/mkt/active-campaign");
    expect(result).toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("retorna referralCode somente com consentimento", () => {
    localStorage.setItem("referralCode", "abc123");
    expect(getReferralCodeIfConsented()).toBe("");

    localStorage.setItem(
      "clube_grito_cookie_consent",
      JSON.stringify({ necessary: true, marketing: true })
    );
    expect(getReferralCodeIfConsented()).toBe("abc123");
  });

  it("gera hash determinístico para mesma política", () => {
    const input = {
      consent_area: "general",
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

    const hashA = computePolicyHash(input);
    const hashB = computePolicyHash(input);
    expect(hashA).toBe(hashB);
    expect(hashA.startsWith("fnv1a-")).toBe(true);
  });
});
