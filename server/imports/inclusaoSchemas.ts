import { z } from "zod";

const emptyToUndef = (v: any) => {
  if (v === "" || v === null || v === undefined) return undefined;

  const s = String(v).trim();
  if (!s) return undefined;

  const lowered = s.toLowerCase();
  if (["-", "—", "–", "n/a", "na", "null", "undefined"].includes(lowered)) return undefined;

  return v;
};

export const optStr = z.preprocess(
  (v) => {
    const val = emptyToUndef(v);
    if (val === undefined) return undefined;
    return String(val).trim();
  },
  z.string().optional()
);

export const optEmail = z.preprocess(
  (v) => {
    const val = emptyToUndef(v);
    if (val === undefined) return undefined;
    return String(val).trim();
  },
  z.string().email().optional()
);

export const optNum = z.preprocess(
  (v) => {
    const val = emptyToUndef(v);
    if (val === undefined) return undefined;
    return Number(val);
  },
  z.number().optional()
);

export const optStrFromAny = z.preprocess(
  (v) => {
    const val = emptyToUndef(v);
    if (val === undefined) return undefined;
    return String(val);
  },
  z.string().optional()
);

export const ProgramaRowSchema = z.object({
  nome: z.string().min(2),
  modalidade: optStr,
  duracao: optStr,
  vagasDisponiveis: optNum,
  taxaOcupacaoPercent: optNum,
  status: optStr,
  descricao: optStr,
  categoria: optStr,
});

export const TurmaRowSchema = z.object({
  programaNome: z.string().min(2),
  nome: z.string().min(2),
  codigo: optStrFromAny,
  vagasDisponiveis: optNum,
  dataInicio: optStr,
  horaInicio: optStr,
  dataFim: optStr,
  horaFim: optStr,
  local: optStr,
  status: optStr,
  descricao: optStr,
});

export const CursoRowSchema = z.object({
  programaNome: z.string().min(2),
  nome: z.string().min(2),
  categoria: optStr,
  cargaHorariaHoras: z.coerce.number().min(1),
  horarioEntrada: optStr,
  horarioSaida: optStr,
  status: optStr,
  descricao: optStr,
  turmasCodigos: optStr,
});

const onlyDigits = (v: string) => v.replace(/\D/g, "");

export function isValidCPF(input: string): boolean {
  const cpf = onlyDigits(String(input ?? ""));
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calcDigit = (base: string, factor: number) => {
    let sum = 0;
    for (let i = 0; i < base.length; i++) {
      sum += Number(base[i]) * (factor - i);
    }
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };

  const d1 = calcDigit(cpf.slice(0, 9), 10);
  const d2 = calcDigit(cpf.slice(0, 10), 11);

  return cpf === cpf.slice(0, 9) + String(d1) + String(d2);
}

export const reqCpfFromAny = z.preprocess(
  (v) => {
    const val = emptyToUndef(v);
    if (val === undefined) return undefined;
    const digits = onlyDigits(String(val).trim());
    return digits ? digits : undefined;
  },
  z
    .string({ required_error: "CPF obrigatório" })
    .length(11, "CPF inválido")
    .refine((cpf) => isValidCPF(cpf), "CPF inválido")
);

const isoToDate = z.preprocess((v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  if (v instanceof Date) return isNaN(v.getTime()) ? undefined : v;
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}, z.date().optional());

export const ParticipanteRowSchema = z.object({
  nome: z.string().min(2),
  cpf: reqCpfFromAny,
  email: optEmail,
  telefone: optStrFromAny,

  genero: optStr,
  idade: z.coerce.number().int().min(0).optional(),

  codigoMatricula: optStr,
  identificador: optStr,

  dataIngresso: optStr,
  endereco: optStr,
  escolaridade: optStr,
  experienciaProfissional: optStr,
  objetivosProfissionais: optStr,
  turmasCodigos: optStr,

  dataNascimento: isoToDate.optional(),
  dataEntrada: isoToDate.optional(),
  formaAcesso: optStr,

  estadoCivil: optStr,
  religiao: optStr,
  naturalidade: optStr,
  nacionalidade: optStr,
  podeSairSozinho: z.boolean().optional(),
  corRaca: optStr,
});
