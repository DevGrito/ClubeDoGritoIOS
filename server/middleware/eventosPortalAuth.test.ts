import { describe, expect, it } from "vitest";
import {
  canAccessEventosAdmin,
  isStaffAuthBlockedByPortalSession,
} from "./eventosAdminPolicy";

describe("canAccessEventosAdmin", () => {
  it("nega usuário do portal público", () => {
    expect(canAccessEventosAdmin({ actorType: "eventos_portal", papel: "eventos_portal" })).toBe(false);
  });

  it("nega aluno, scanner, professor e monitor", () => {
    expect(canAccessEventosAdmin({ actorType: "aluno_portal", papel: "aluno_portal" })).toBe(false);
    expect(canAccessEventosAdmin({ actorType: "scanner", papel: "scanner" })).toBe(false);
    expect(canAccessEventosAdmin({ papel: "professor" })).toBe(false);
    expect(canAccessEventosAdmin({ papel: "monitor" })).toBe(false);
    expect(canAccessEventosAdmin({ papel: "tecnica" })).toBe(false);
  });

  it("permite admin, coordenador, marketing e dev", () => {
    expect(canAccessEventosAdmin({ papel: "coordenador", actorType: "coordenador" })).toBe(true);
    expect(canAccessEventosAdmin({ role: "admin" })).toBe(true);
    expect(canAccessEventosAdmin({ papel: "dev" })).toBe(true);
    expect(canAccessEventosAdmin({ papel: "marketing" })).toBe(true);
    expect(canAccessEventosAdmin({ papel: "super_admin" })).toBe(true);
  });

  it("permite sessão de desenvolvedor via flag", () => {
    expect(canAccessEventosAdmin({ papel: "qualquer" }, { isDeveloper: true })).toBe(true);
  });
});

describe("requireAuth vs portal session", () => {
  it("bloqueia sessão pública no middleware administrativo", () => {
    expect(isStaffAuthBlockedByPortalSession({ actorType: "eventos_portal", portalUserId: 9 })).toBe(true);
  });

  it("não bloqueia sessão staff limpa", () => {
    expect(isStaffAuthBlockedByPortalSession({ actorType: "coordenador" })).toBe(false);
  });
});
