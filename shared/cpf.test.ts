import { describe, expect, it } from "vitest";
import { isValidCpfLength, normalizeCpfDigits } from "./cpf";

describe("normalizeCpfDigits", () => {
  it("remove máscara", () => {
    expect(normalizeCpfDigits("159.155.726-77")).toBe("15915572677");
  });

  it("mantém só dígitos", () => {
    expect(normalizeCpfDigits("16110662631")).toBe("16110662631");
  });

  it("valida tamanho", () => {
    expect(isValidCpfLength("15915572677")).toBe(true);
    expect(isValidCpfLength("123")).toBe(false);
  });
});
