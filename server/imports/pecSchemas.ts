// pecSchemas.ts
import { z } from "zod";

const emptyToUndef = (v: any) =>
  v === "" || v === null || v === undefined ? undefined : v;

// string opcional
export const optStr = z.preprocess(
  (v) => {
    const val = emptyToUndef(v);
    if (val === undefined) return undefined;
    return String(val).trim();
  },
  z.string().optional()
);

// Excel manda número -> vira string
export const optStrFromAny = z.preprocess(
  (v) => {
    const val = emptyToUndef(v);
    if (val === undefined) return undefined;
    return String(val).trim();
  },
  z.string().optional()
);

const onlyDigits = (v: any) => String(v ?? "").replace(/\D/g, "");

const cpfSchema = z
  .preprocess((v) => onlyDigits(v), z.string())
  .refine((v) => v.length === 11, "CPF deve ter 11 dígitos")
  .refine((v) => !/^(\d)\1{10}$/.test(v), "CPF inválido (dígitos repetidos)");

// OBS: se quiser o validador do dígito verificador depois eu te passo.
// isso aqui já resolve 99% dos casos (000000, 111111, etc)

const telefoneSchema = z
  .preprocess((v) => onlyDigits(v), z.string().optional())
  .refine((v) => !v || (v.length >= 10 && v.length <= 11), "Telefone inválido")
  .optional();

export const AlunoRowSchema = z.object({
  nome_completo: z.string().min(2, "Nome obrigatório"),
  cpf: cpfSchema,
  telefone: telefoneSchema,
  email: optStr, // se quiser validar e-mail, trocamos pra z.string().email().optional()
  rg: optStrFromAny,
  data_nascimento: optStr, // opcional (YYYY-MM-DD)
});
