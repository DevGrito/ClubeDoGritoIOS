import { z } from "zod";

const emptyToUndef = (v: any) =>
  v === "" || v === null || v === undefined ? undefined : v;

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

// ✅ Excel manda número -> aqui vira string SEM quebrar
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
  modalidade: optStr,              // Presencial | Híbrido | EAD
  duracao: optStr,                 // Ex: 3 meses
  vagasDisponiveis: optNum,        // ✅ em vez de numeroVagas
  taxaOcupacaoPercent: optNum,     // ✅ em vez de taxaOcupacao
  status: optStr,                  // Planejado | Em andamento | Concluído
  descricao: optStr,
  categoria: optStr,
});

export const TurmaRowSchema = z.object({
  programaNome: z.string().min(2),
  nome: z.string().min(2),
  codigo: optStrFromAny,           // ✅ aceita número
  vagasDisponiveis: optNum,        // ✅ em vez de numeroVagas
  dataInicio: optStr,              // YYYY-MM-DD
  horaInicio: optStr,              // HH:MM
  dataFim: optStr,                 // YYYY-MM-DD
  horaFim: optStr,                 // HH:MM
  local: optStr,
  status: optStr,                  // Planejado | Ativo | Concluído
  descricao: optStr,
});

export const CursoRowSchema = z.object({
  programaNome: z.string().min(2),
  nome: z.string().min(2),
  categoria: optStr,
  cargaHorariaHoras: z.coerce.number().min(1), // ✅ em vez de cargaHoraria
  horarioEntrada: optStr,
  horarioSaida: optStr,
  status: optStr,
  descricao: optStr,
  turmasCodigos: optStr,            // COD1;COD2
});

export const ParticipanteRowSchema = z.object({
  nome: z.string().min(2),
  cpf: optStrFromAny,
  genero: z.string().min(1),
  idade: z.coerce.number().int().min(0),
  codigoMatricula: optStr,
  identificador: optStr,
  dataIngresso: optStr,
  email: optEmail,
  telefone: optStrFromAny,
  endereco: optStr,
  escolaridade: optStr,
  experienciaProfissional: optStr,
  objetivosProfissionais: optStr,
  turmasCodigos: optStr,
});
