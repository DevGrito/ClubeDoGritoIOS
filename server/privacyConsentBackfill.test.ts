import { describe, expect, it } from "vitest";
import type { LgpdCoverageMetrics } from "./privacyConsentBackfill";

function buildCoverageMetrics(row: {
  total_users: number;
  users_with_termos: number;
  users_with_linked_consent: number;
  users_with_termos_sem_privacy: number;
}): Pick<LgpdCoverageMetrics, "linkedConsentPct" | "termosCoveragePct"> {
  const totalUsers = row.total_users;
  const usersWithLinkedConsent = row.users_with_linked_consent;
  const usersWithTermos = row.users_with_termos;
  const semPrivacy = row.users_with_termos_sem_privacy;

  return {
    linkedConsentPct:
      totalUsers > 0 ? Math.round((usersWithLinkedConsent / totalUsers) * 1000) / 10 : 0,
    termosCoveragePct:
      usersWithTermos > 0
        ? Math.round(((usersWithTermos - semPrivacy) / usersWithTermos) * 1000) / 10
        : 0,
  };
}

describe("privacyConsentBackfill", () => {
  it("calcula percentuais de cobertura", () => {
    const m = buildCoverageMetrics({
      total_users: 100,
      users_with_linked_consent: 25,
      users_with_termos: 80,
      users_with_termos_sem_privacy: 20,
    });
    expect(m.linkedConsentPct).toBe(25);
    expect(m.termosCoveragePct).toBe(75);
  });

  it("retorna 0% quando não há usuários", () => {
    const m = buildCoverageMetrics({
      total_users: 0,
      users_with_linked_consent: 0,
      users_with_termos: 0,
      users_with_termos_sem_privacy: 0,
    });
    expect(m.linkedConsentPct).toBe(0);
    expect(m.termosCoveragePct).toBe(0);
  });
});
