import { describe, expect, it } from "vitest";
import { getLgpdIntegrationsStatus } from "./lgpdObservability";

describe("lgpdObservability", () => {
  it("reporta integrações conforme env", () => {
    const status = getLgpdIntegrationsStatus();
    expect(status).toMatchObject({
      datadog: expect.any(Boolean),
      webhook: expect.any(Boolean),
      sentry: expect.any(Boolean),
      hmacSecret: expect.any(Boolean),
    });
  });
});
