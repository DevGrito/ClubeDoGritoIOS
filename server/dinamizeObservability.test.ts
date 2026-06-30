import { afterEach, describe, expect, it } from "vitest";
import { getDinamizeIntegrationStatus, setDinamizeSyncAlertHandler, emitDinamizeSyncFailureAlert } from "./dinamizeObservability";

describe("dinamizeObservability", () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
  });

  it("webhookConfigured false sem URL", () => {
    delete process.env.DINAMIZE_WEBHOOK_URL;
    const status = getDinamizeIntegrationStatus();
    expect(status.webhookConfigured).toBe(false);
    expect(status.lgpdPayloadEnabled).toBe(true);
  });

  it("webhookConfigured true com URL", () => {
    process.env.DINAMIZE_WEBHOOK_URL = "https://receiver.webhook.dinamize.com/test";
    const status = getDinamizeIntegrationStatus();
    expect(status.webhookConfigured).toBe(true);
  });

  it("lgpdPayloadEnabled false quando DINAMIZE_LGPD_PAYLOAD=0", () => {
    process.env.DINAMIZE_LGPD_PAYLOAD = "0";
    expect(getDinamizeIntegrationStatus().lgpdPayloadEnabled).toBe(false);
  });

  it("emitDinamizeSyncFailureAlert chama handler registrado", () => {
    const calls: string[] = [];
    setDinamizeSyncAlertHandler((d) => calls.push(d.errorMessage));
    emitDinamizeSyncFailureAlert({
      errorMessage: "HTTP 500",
      eventType: "doador",
      alertSource: "manual/sync-doador",
      entityId: 1,
    });
    expect(calls).toEqual(["HTTP 500"]);
    setDinamizeSyncAlertHandler(null);
  });
});
