import { describe, expect, it } from "vitest";
import {
  buildUsuarioFromAlunoFicha,
  buildUsuarioFromStaffFicha,
  isAlunoMeusDadosActor,
  mergeAlunoTermosIntoAceites,
  mergeLegalAcceptances,
  mergeStaffTermosIntoAceites,
  normalizeCpfDigits,
  resolveMeusDadosProfile,
  sanitizeUsuarioForProfile,
  shouldIncludeDonationData,
} from "./meusDados";

describe("mergeLegalAcceptances", () => {
  it("completa termos a partir de users quando legal_acceptances está vazio", () => {
    const result = mergeLegalAcceptances(
      [],
      { termos_uso_aceito_em: "2026-01-15T10:00:00Z", termos_uso_versao: "2026-04-01" },
      []
    );
    expect(result).toHaveLength(1);
    expect(result[0].document_type).toBe("terms");
    expect(result[0].source).toBe("users.termos_uso");
  });

  it("completa política de privacidade a partir de privacy_consents", () => {
    const result = mergeLegalAcceptances(
      [],
      null,
      [{ privacy_policy_version: "1.0", updated_at: "2026-02-01T12:00:00Z" }]
    );
    expect(result[0].document_type).toBe("privacy_policy");
    expect(result[0].source).toBe("privacy_consents");
  });
});

describe("normalizeCpfDigits", () => {
  it("remove formatação do CPF", () => {
    expect(normalizeCpfDigits("123.456.789-01")).toBe("12345678901");
  });
});

describe("isAlunoMeusDadosActor", () => {
  it("reconhece aluno e aluno_portal", () => {
    expect(isAlunoMeusDadosActor("aluno")).toBe(true);
    expect(isAlunoMeusDadosActor("aluno_portal")).toBe(true);
    expect(isAlunoMeusDadosActor("doador")).toBe(false);
  });
});

describe("buildUsuarioFromAlunoFicha", () => {
  it("prioriza users mas completa com ficha do aluno", () => {
    const usuario = buildUsuarioFromAlunoFicha(
      { nome_completo: "Maria", email: "m@x.com", telefone: "11999" },
      "12345678901",
      { id: 5, nome: "Antiga", email: null, telefone: null }
    );
    expect(usuario?.nome).toBe("Antiga");
    expect(usuario?.email).toBe("m@x.com");
    expect(usuario?.cpf).toBe("12345678901");
  });

  it("monta cadastro só da ficha quando não há users", () => {
    const usuario = buildUsuarioFromAlunoFicha(
      { nome_completo: "João", whatsapp: "11888" },
      "12345678901",
      null
    );
    expect(usuario?.nome).toBe("João");
    expect(usuario?.telefone).toBe("11888");
  });
});

describe("mergeAlunoTermosIntoAceites", () => {
  it("adiciona termos da tabela aluno", () => {
    const result = mergeAlunoTermosIntoAceites([], {
      termos_uso_aceito_em: "2026-03-01T00:00:00Z",
      termos_uso_versao: "2026-04-01",
    });
    expect(result[0].source).toBe("aluno.termos_uso");
  });
});

describe("buildUsuarioFromStaffFicha", () => {
  it("mescla users com ficha do staff", () => {
    const u = buildUsuarioFromStaffFicha(
      { nome: "Prof", email: "p@x.com", telefone: "11999", programa: "pec" },
      { id: 1, nome: "Antigo", email: null }
    );
    expect(u?.nome).toBe("Antigo");
    expect(u?.email).toBe("p@x.com");
  });
});

describe("mergeStaffTermosIntoAceites", () => {
  it("adiciona termos da tabela de staff", () => {
    const result = mergeStaffTermosIntoAceites(
      [],
      { termos_uso_aceito_em: "2026-01-01", termos_uso_versao: "1.0" },
      "professores.termos_uso"
    );
    expect(result[0].source).toBe("professores.termos_uso");
  });
});

describe("resolveMeusDadosProfile", () => {
  it("isola perfil aluno, staff, patrocinador e doador", () => {
    expect(resolveMeusDadosProfile({ cpf: "12345678901", usersId: 1, exportKey: "x" })).toBe("aluno");
    expect(
      resolveMeusDadosProfile({
        usersId: 1,
        staffKind: "professor",
        exportKey: "1",
        actorType: "professor",
      })
    ).toBe("staff");
    expect(
      resolveMeusDadosProfile({ usersId: 2, actorType: "patrocinador", exportKey: "2" })
    ).toBe("patrocinador");
    expect(resolveMeusDadosProfile({ usersId: 3, actorType: "doador", exportKey: "3" })).toBe(
      "doador"
    );
  });
});

describe("shouldIncludeDonationData", () => {
  it("só inclui doações para perfil doador", () => {
    expect(shouldIncludeDonationData("doador")).toBe(true);
    expect(shouldIncludeDonationData("aluno")).toBe(false);
    expect(shouldIncludeDonationData("staff")).toBe(false);
    expect(shouldIncludeDonationData("patrocinador")).toBe(false);
  });
});

describe("sanitizeUsuarioForProfile", () => {
  it("remove campos Stripe fora do perfil doador", () => {
    const out = sanitizeUsuarioForProfile(
      { nome: "A", plano: "eco", stripe_customer_id: "cus_1" },
      "aluno"
    );
    expect(out?.nome).toBe("A");
    expect(out?.plano).toBeUndefined();
    expect(out?.stripe_customer_id).toBeUndefined();
  });
});
