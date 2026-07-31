import { describe, expect, it } from "vitest";

import { formatDateBrazil } from "./brazil-date";

describe("formatDateBrazil", () => {
  it("preserva uma data sem horário", () => {
    expect(formatDateBrazil("2017-02-04")).toBe("04/02/2017");
  });

  it("não desloca um DATE serializado como meia-noite UTC", () => {
    expect(formatDateBrazil("2017-02-04T00:00:00.000Z")).toBe("04/02/2017");
  });
});
