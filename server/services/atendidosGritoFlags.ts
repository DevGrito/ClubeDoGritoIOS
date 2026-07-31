/**
 * Flags de escrita do cadastro unificado (atendidos_grito).
 *
 * ATENDIDOS_GRITO_LEGACY_WRITE=true|false  (default: false)
 *   Controla escrita nas tabelas legadas em geral.
 *
 * Overrides por programa (opcional; se omitido, usam o global):
 *   ATENDIDOS_GRITO_LEGACY_WRITE_PSICO
 *   ATENDIDOS_GRITO_LEGACY_WRITE_PEC
 *   ATENDIDOS_GRITO_LEGACY_WRITE_INCLUSAO
 *
 * No go-live, definir explicitamente por ambiente para evitar comportamento implícito.
 */

export type ProgramaLegacyWrite = "pec" | "inclusao" | "psico_comunidade";

function parseBoolEnv(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw == null || String(raw).trim() === "") return defaultValue;
  const v = String(raw).trim().toLowerCase();
  if (["0", "false", "no", "off"].includes(v)) return false;
  if (["1", "true", "yes", "on"].includes(v)) return true;
  return defaultValue;
}

const PROGRAM_ENV: Record<ProgramaLegacyWrite, string> = {
  pec: "ATENDIDOS_GRITO_LEGACY_WRITE_PEC",
  inclusao: "ATENDIDOS_GRITO_LEGACY_WRITE_INCLUSAO",
  psico_comunidade: "ATENDIDOS_GRITO_LEGACY_WRITE_PSICO",
};

/** true = escreve legado (+ sync mestre). false = só mestre. */
export function isLegacyWriteEnabled(programa?: ProgramaLegacyWrite): boolean {
  // Default false: novos cadastros/matrículas não escrevem em aluno / participantes_inclusao.
  const global = parseBoolEnv(process.env.ATENDIDOS_GRITO_LEGACY_WRITE, false);
  if (!programa) return global;
  const specific = process.env[PROGRAM_ENV[programa]];
  if (specific != null && String(specific).trim() !== "") {
    return parseBoolEnv(specific, global);
  }
  return global;
}

export function getAtendidosGritoWriteFlags() {
  return {
    legacyWriteGlobal: isLegacyWriteEnabled(),
    legacyWritePec: isLegacyWriteEnabled("pec"),
    legacyWriteInclusao: isLegacyWriteEnabled("inclusao"),
    legacyWritePsico: isLegacyWriteEnabled("psico_comunidade"),
    note:
      "Default false. Cadastro PEC/Inclusão grava só em atendidos_grito; matrícula cria vínculo de turma + programa (sem espelho legado).",
  };
}
