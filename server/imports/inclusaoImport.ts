import * as XLSX from "xlsx";
import { z } from "zod";
import {
  ProgramaRowSchema,
  TurmaRowSchema,
  CursoRowSchema,
  ParticipanteRowSchema,
} from "./inclusaoSchemas";

type PreviewRow<T> = {
  index: number;       // índice no array (0..n)
  data: T | any;       // dados parseados
  isValid: boolean;
  errors?: { path: string; message: string }[];
};

export type ImportPreview = {
  programas: PreviewRow<z.infer<typeof ProgramaRowSchema>>[];
  turmas: PreviewRow<z.infer<typeof TurmaRowSchema>>[];
  cursos: PreviewRow<z.infer<typeof CursoRowSchema>>[];
  participantes: PreviewRow<z.infer<typeof ParticipanteRowSchema>>[];
  stats: {
    programas: { valid: number; invalid: number };
    turmas: { valid: number; invalid: number };
    cursos: { valid: number; invalid: number };
    participantes: { valid: number; invalid: number };
  };
};

function normalizeHeaders(obj: any) {
  const out: any = {};

  for (const [k, v] of Object.entries(obj)) {
    // 1) corta tudo depois do "(" (remove dicas do template)
    const base = String(k).split("(")[0].trim();

    // 2) remove acentos e tudo que não for letra/número
    const key = base
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, ""); // remove espaços, _, -, |, :, etc.

    out[key] = v;
  }

  return out;
}
// ✅ converte número serial do Excel para Date
function excelSerialToDate(serial: number) {
  // Excel (Windows): dias desde 1899-12-30
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400; // segundos
  return new Date(utcValue * 1000);
}

// ✅ aceita: Date | "YYYY-MM-DD" | serial (46023) | string "46023"
function excelSerialToISO(serial: number): string | undefined {
  if (!Number.isFinite(serial)) return undefined;

  // Excel (Windows) usa base 1899-12-30 (por causa do bug de 1900)
  const epoch = Date.UTC(1899, 11, 30);
  const ms = epoch + Math.round(serial) * 24 * 60 * 60 * 1000;

  const d = new Date(ms);
  if (isNaN(d.getTime())) return undefined;

  // YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

function normalizeDateToISO(value: any): string | undefined {
  if (value === "" || value === null || value === undefined) return undefined;

  // Já veio como string tipo "2025-01-10"
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return undefined;

    // Se já está em YYYY-MM-DD, mantém
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    // Se vier como número em string "46023"
    const n = Number(s);
    if (Number.isFinite(n)) return excelSerialToISO(n);

    return s; // fallback: deixa passar (validação decide)
  }

  // Veio como número (serial do Excel)
  if (typeof value === "number") {
    return excelSerialToISO(value);
  }

  // Veio como Date
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return undefined;
    return value.toISOString().slice(0, 10);
  }

  return undefined;
}

  function mapRow(sheetName: string, raw: any) {
    const n = normalizeHeaders(raw);

  if (sheetName === "Programas") {
    return {
      nome: n.nome,
      modalidade: n.modalidade,
      duracao: n.duracao,
      vagasDisponiveis: n.vagasdisponiveis,
      taxaOcupacaoPercent: n.taxaocupacaopercent,
      status: n.status,
      descricao: n.descricao,
      categoria: n.categoria, // ✅ IMPORTANTE (evita null no banco)
    };
  }
  if (sheetName === "Turmas") {
    return {
      programaNome: n.programanome || n.programa,
      nome: n.nome,
      codigo: n.codigo,
      vagasDisponiveis: n.vagasdisponiveis,
      dataInicio: normalizeDateToISO(n.datainicio),
      horaInicio: n.horainicio,
      dataFim: normalizeDateToISO(n.datatermino || n.dataterminio),
      horaFim: n.horatermino,
      local: n.local,
      status: n.status,
      descricao: n.descricao,
    };
  }

    if (sheetName === "Cursos") {
      return {
        programaNome: n.programanome || n.programa,
        nome: n.nome,
        categoria: n.categoria,
        cargaHorariaHoras: n.cargahorariahoras,
        horarioEntrada: n.horarioentrada,
        horarioSaida: n.horariosaida,
        status: n.status,
        descricao: n.descricao,
        turmasCodigos: n.turmascodigos,
      };
    }

    // Participantes
      return {
        nome: n.nome,
        cpf: n.cpf,
        genero: n.genero,
        idade: n.idade,
        codigoMatricula: n.codigomatricula,
        identificador: n.identificador,
        dataIngresso: normalizeDateToISO(n.dataingresso),
        email: n.email,
        telefone: n.telefone,
        endereco: n.endereco,
        escolaridade: n.escolaridade,
        experienciaProfissional: n.experienciaprofissional,
        objetivosProfissionais: n.objetivosprofissionais,
        turmasCodigos: n.turmascodigos,
      };
    }

function validateRows<T>(rows: any[], schema: z.ZodSchema<T>, sheetName: string): PreviewRow<T>[] {
  return rows.map((raw, index) => {
    const mapped = mapRow(sheetName, raw);
    const parsed = schema.safeParse(mapped);

    if (!parsed.success) {
      return {
        index,
        data: mapped,
        isValid: false,
        errors: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      };
    }
    return { index, data: parsed.data, isValid: true };
  });
}

export function buildInclusaoPreviewFromExcel(buffer: Buffer): ImportPreview {
  const wb = XLSX.read(buffer, { type: "buffer" });

  const getSheetRows = (name: string) => {
    const ws = wb.Sheets[name];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json(ws, { defval: "" });
  };

  const programasRaw = getSheetRows("Programas");
  const turmasRaw = getSheetRows("Turmas");
  const cursosRaw = getSheetRows("Cursos");
  const participantesRaw = getSheetRows("Participantes");

  const programas = validateRows(programasRaw, ProgramaRowSchema, "Programas");
  const turmas = validateRows(turmasRaw, TurmaRowSchema, "Turmas");
  const cursos = validateRows(cursosRaw, CursoRowSchema, "Cursos");
  const participantes = validateRows(participantesRaw, ParticipanteRowSchema, "Participantes");

  const count = (arr: any[]) => ({
    valid: arr.filter((r) => r.isValid).length,
    invalid: arr.filter((r) => !r.isValid).length,
  });

  return {
    programas,
    turmas,
    cursos,
    participantes,
    stats: {
      programas: count(programas),
      turmas: count(turmas),
      cursos: count(cursos),
      participantes: count(participantes),
    },
  };
}
