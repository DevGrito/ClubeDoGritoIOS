import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  CONSENT_UPDATED_EVENT,
  dispatchConsentUpdated,
  getConsentSnapshot,
  hasConsent,
  runWithConsent,
} from "./consentManager";

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

describe("consentManager", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    const localStorageMock = createLocalStorageMock();
    vi.stubGlobal("localStorage", localStorageMock);
    vi.stubGlobal("window", {
      dispatchEvent: vi.fn(),
    });
  });

  it("retorna snapshot seguro por padrão", () => {
    const snapshot = getConsentSnapshot();
    expect(snapshot.necessary).toBe(true);
    expect(snapshot.analytics).toBe(false);
    expect(snapshot.marketing).toBe(false);
  });

  it("respeita consentimento salvo no cookie consent", () => {
    localStorage.setItem(
      "clube_grito_cookie_consent",
      JSON.stringify({ necessary: true, analytics: true, marketing: true })
    );

    expect(hasConsent("analytics")).toBe(true);
    expect(hasConsent("marketing")).toBe(true);
  });

  it("bloqueia execução quando consentimento não existe", async () => {
    const task = vi.fn().mockResolvedValue("ok");
    const onBlocked = vi.fn();

    const result = await runWithConsent("marketing", task, onBlocked);

    expect(result).toBeNull();
    expect(task).not.toHaveBeenCalled();
    expect(onBlocked).toHaveBeenCalledOnce();
  });

  it("executa task quando consentimento existe", async () => {
    localStorage.setItem(
      "clube_grito_cookie_consent",
      JSON.stringify({ necessary: true, marketing: true })
    );
    const task = vi.fn().mockResolvedValue("ok");

    const result = await runWithConsent("marketing", task);

    expect(result).toBe("ok");
    expect(task).toHaveBeenCalledOnce();
  });

  it("dispara evento de atualização", () => {
    dispatchConsentUpdated();
    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: CONSENT_UPDATED_EVENT })
    );
  });
});
