import * as XLSX from "xlsx";
import { z } from "zod";
import {
  ProgramaRowSchema,
  TurmaRowSchema,
  CursoRowSchema,
  ParticipanteRowSchema,
  isValidCPF,
} from "./inclusaoSchemas";

type PreviewRow<T> = {
  index: number;
  data: T | any;
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

function normStr(s: any) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeHeaders(obj: any) {
  const out: any = {};
  for (const [k, v] of Object.entries(obj)) {
    const base = String(k).split("(")[0].trim();
    const key = normStr(base);
    out[key] = v;
  }
  return out;
}

function excelSerialToISO(serial: number): string | undefined {
  if (!Number.isFinite(serial)) return undefined;
  const epoch = Date.UTC(1899, 11, 30);
  const ms = epoch + Math.round(serial) * 24 * 60 * 60 * 1000;
  const d = new Date(ms);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

function brDateToISO(s: string): string | undefined {
  const m = s.match(/^(\d{2})[\/-](\d{2})[\/-](\d{4})$/);
  if (!m) return undefined;
  const [_, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeDateToISO(value: any): string | undefined {
  if (value === "" || value === null || value === undefined) return undefined;

  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const br = brDateToISO(s);
    if (br) return br;
    const n = Number(s);
    if (Number.isFinite(n)) return excelSerialToISO(n);
    return s;
  }

  if (typeof value === "number") return excelSerialToISO(value);

  if (value instanceof Date) {
    if (isNaN(value.getTime())) return undefined;
    return value.toISOString().slice(0, 10);
  }

  return undefined;
}

function normalizeBool(v: any) {
  const s = String(v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (["sim", "s", "true", "1", "yes"].includes(s)) return true;
  if (["nao", "n", "false", "0", "no"].includes(s)) return false;
  return undefined;
}

function normalizeGenero(v: any) {
  const s = String(v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (s === "feminino") return "Feminino";
  if (s === "masculino") return "Masculino";
  if (s === "outro") return "Outro";
  if (s.includes("prefiro")) return "Prefiro não informar";
  return undefined;
}

function computeAgeFromISO(iso?: string) {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return undefined;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age > 0 ? age : undefined;
}

function isRowBlank(raw: any) {
  if (!raw || typeof raw !== "object") return true;
  const vals = Object.values(raw);
  return !vals.some((v) => String(v ?? "").trim() !== "");
}

const ERROR_TRANSLATIONS: Record<string, string> = {
  "Required": "Campo obrigatório",
  "Expected string, received null": "Campo obrigatório",
  "String must contain at least 2 character(s)": "Deve ter pelo menos 2 caracteres",
  "String must contain at least 1 character(s)": "Campo obrigatório",
  "Invalid email": "E-mail inválido",
  "CPF inválido": "CPF inválido (dígitos verificadores não conferem)",
  "CPF deve ter 11 dígitos": "CPF deve ter exatamente 11 dígitos",
  "Expected number, received nan": "Valor numérico inválido",
  "Number must be greater than or equal to 0": "Valor deve ser positivo",
  "Number must be greater than or equal to 1": "Valor deve ser pelo menos 1",
  "Invalid date": "Data inválida",
};

function translateError(path: string, message: string): string {
  if (ERROR_TRANSLATIONS[message]) return ERROR_TRANSLATIONS[message];

  const fieldNames: Record<string, string> = {
    nome: "Nome",
    cpf: "CPF",
    email: "E-mail",
    telefone: "Telefone",
    genero: "Gênero",
    idade: "Idade",
    dataNascimento: "Data de nascimento",
    dataEntrada: "Data de entrada",
    codigoMatricula: "Matrícula",
    estadoCivil: "Estado civil",
    naturalidade: "Naturalidade",
    nacionalidade: "Nacionalidade",
  };

  const fieldLabel = fieldNames[path] || path;

  if (message.includes("Required") || message.includes("required")) {
    return `${fieldLabel} é obrigatório`;
  }
  if (message.includes("Invalid")) {
    return `${fieldLabel} tem formato inválido`;
  }

  return message;
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
      categoria: n.categoria,
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

  const isTemplateNovo =
    sheetName === "PARTICIPANTES_INCLUSAO" ||
    n.nomecompleto !== undefined ||
    n.datanascimento !== undefined ||
    n.dataentrada !== undefined;

  if (isTemplateNovo) {
    const dataNascISO = normalizeDateToISO(n.datanascimento);
    const dataEntradaISO = normalizeDateToISO(n.dataentrada);
    const idade = Number(n.idade) || computeAgeFromISO(dataNascISO);

    return {
      nome: n.nomecompleto || n.nome,
      cpf: String(n.cpf ?? "").replace(/\D/g, ""),
      email: String(n.email ?? "").trim(),
      telefone: String(n.telefone ?? "").trim(),
      genero: normalizeGenero(n.genero) || n.genero,
      idade,
      dataNascimento: dataNascISO ? new Date(dataNascISO) : undefined,
      dataEntrada: dataEntradaISO ? new Date(dataEntradaISO) : undefined,
      formaAcesso: n.formaacesso,
      codigoMatricula: n.numeromatricula || n.codigomatricula,
      estadoCivil: n.estadocivil,
      religiao: n.religiao,
      naturalidade: n.naturalidade,
      nacionalidade: n.nacionalidade,
      podeSairSozinho: normalizeBool(n.podesairsozinho),
      corRaca: n.corraca,
    };
  }

  return {
    nome: n.nome,
    cpf: String(n.cpf ?? "").replace(/\D/g, ""),
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

function validateRows<T>(
  rows: any[],
  schema: z.ZodSchema<T>,
  sheetName: string
): PreviewRow<T>[] {
  return rows
    .filter((r) => !isRowBlank(r))
    .map((raw, index) => {
      const mapped = mapRow(sheetName, raw);
      const parsed = schema.safeParse(mapped);

      if (!parsed.success) {
        return {
          index,
          data: mapped,
          isValid: false,
          errors: parsed.error.issues.map((i) => ({
            path: i.path.join("."),
            message: translateError(i.path.join("."), i.message),
          })),
        };
      }
      return { index, data: parsed.data, isValid: true };
    });
}

function yieldEventLoop(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

export async function buildInclusaoPreviewFromExcelAsync(buffer: Buffer): Promise<ImportPreview> {
  const memBefore = process.memoryUsage();
  console.log(`💾 [IMPORT] Memória antes do XLSX.read: RSS=${(memBefore.rss/1024/1024).toFixed(0)}MB heap=${(memBefore.heapUsed/1024/1024).toFixed(0)}MB`);

  if (!buffer || buffer.length === 0) {
    throw new Error("Buffer vazio — arquivo não recebido corretamente");
  }

  const t0 = Date.now();
  const wb = XLSX.read(buffer, {
    type: "buffer",
    cellStyles: false,
    cellNF: false,
    cellHTML: false,
    cellFormula: false,
    sheetStubs: false,
  });
  const readMs = Date.now() - t0;

  const memAfter = process.memoryUsage();
  console.log(`📄 [IMPORT PREVIEW] XLSX.read concluído em ${readMs}ms — sheetNames: ${wb.SheetNames.join(", ")}`);
  console.log(`💾 [IMPORT] Memória após XLSX.read: RSS=${(memAfter.rss/1024/1024).toFixed(0)}MB heap=${(memAfter.heapUsed/1024/1024).toFixed(0)}MB (delta heap: ${((memAfter.heapUsed-memBefore.heapUsed)/1024/1024).toFixed(0)}MB)`);

  const getSheetRows = (sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json(ws, { defval: "" });
  };

  const findSheetByCandidates = (candidates: string[]) => {
    const wanted = new Set(candidates.map(normStr));
    const hit = wb.SheetNames.find((sn) => wanted.has(normStr(sn)));
    return hit || null;
  };

  const detectParticipantesSheet = () => {
    const hit =
      findSheetByCandidates([
        "Participantes",
        "PARTICIPANTES_INCLUSAO",
        "Participantes Inclusão",
        "Participantes Inclusao",
        "Alunos",
        "Alunos Inclusao",
        "Importacao Alunos",
        "Importação Alunos",
        "Planilha1",
        "Sheet1",
      ]) || null;

    if (hit) {
      const rows = getSheetRows(hit);
      if (rows.length) return hit;
    }

    for (const sn of wb.SheetNames) {
      const rows = getSheetRows(sn);
      const first = rows?.[0];
      if (!first) continue;
      const keys = Object.keys(normalizeHeaders(first));
      const hasCpf = keys.includes("cpf");
      const hasNome = keys.includes("nomecompleto") || keys.includes("nome");
      if (hasCpf && hasNome) return sn;
    }

    return null;
  };

  await yieldEventLoop();

  const programasRaw = getSheetRows("Programas");
  const turmasRaw = getSheetRows("Turmas");
  const cursosRaw = getSheetRows("Cursos");

  const programas = validateRows(programasRaw, ProgramaRowSchema, "Programas");
  const turmas = validateRows(turmasRaw, TurmaRowSchema, "Turmas");
  const cursos = validateRows(cursosRaw, CursoRowSchema, "Cursos");

  await yieldEventLoop();

  const participantesSheetName = detectParticipantesSheet();
  const participantesRaw = participantesSheetName
    ? getSheetRows(participantesSheetName)
    : [];

  console.log(`📊 [IMPORT] ${participantesRaw.length} linhas brutas de participantes`);

  await yieldEventLoop();

  const CHUNK_SIZE = 200;
  const allParticipantes: PreviewRow<z.infer<typeof ParticipanteRowSchema>>[] = [];
  const nonBlankRows = participantesRaw.filter((r) => !isRowBlank(r));

  for (let i = 0; i < nonBlankRows.length; i += CHUNK_SIZE) {
    const chunk = nonBlankRows.slice(i, i + CHUNK_SIZE);
    const chunkResults = chunk.map((raw, chunkIdx) => {
      const globalIndex = i + chunkIdx;
      const mapped = mapRow(
        participantesSheetName || "Participantes",
        raw
      );
      const parsed = ParticipanteRowSchema.safeParse(mapped);

      if (!parsed.success) {
        return {
          index: globalIndex,
          data: mapped,
          isValid: false,
          errors: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: translateError(issue.path.join("."), issue.message),
          })),
        } as PreviewRow<z.infer<typeof ParticipanteRowSchema>>;
      }
      return { index: globalIndex, data: parsed.data, isValid: true } as PreviewRow<z.infer<typeof ParticipanteRowSchema>>;
    });
    allParticipantes.push(...chunkResults);
    await yieldEventLoop();
  }

  const cpfSeen = new Map<string, number>();
  for (const row of allParticipantes) {
    if (!row.isValid) continue;
    const cpf = String(row.data?.cpf ?? "").replace(/\D/g, "");
    if (!cpf) continue;

    if (cpfSeen.has(cpf)) {
      const firstLine = cpfSeen.get(cpf)! + 1;
      row.isValid = false;
      row.errors = [
        {
          path: "cpf",
          message: `CPF duplicado na planilha (mesmo CPF na linha ${firstLine})`,
        },
      ];
    } else {
      cpfSeen.set(cpf, row.index);
    }
  }

  const count = (arr: PreviewRow<any>[]) => ({
    valid: arr.filter((r) => r.isValid).length,
    invalid: arr.filter((r) => !r.isValid).length,
  });

  return {
    programas,
    turmas,
    cursos,
    participantes: allParticipantes,
    stats: {
      programas: count(programas),
      turmas: count(turmas),
      cursos: count(cursos),
      participantes: count(allParticipantes),
    },
  };
}

export function buildInclusaoPreviewFromExcel(buffer: Buffer): ImportPreview {
  const wb = XLSX.read(buffer, { type: "buffer" });
  console.log("📄 [IMPORT PREVIEW] sheetNames:", wb.SheetNames);

  const getSheetRows = (sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return [];
    return XLSX.utils.sheet_to_json(ws, { defval: "" });
  };

  const findSheetByCandidates = (candidates: string[]) => {
    const wanted = new Set(candidates.map(normStr));
    const hit = wb.SheetNames.find((sn) => wanted.has(normStr(sn)));
    return hit || null;
  };

  const detectParticipantesSheet = () => {
    const hit =
      findSheetByCandidates([
        "Participantes", "PARTICIPANTES_INCLUSAO", "Participantes Inclusão",
        "Participantes Inclusao", "Alunos", "Alunos Inclusao",
        "Importacao Alunos", "Importação Alunos", "Planilha1", "Sheet1",
      ]) || null;
    if (hit) {
      const rows = getSheetRows(hit);
      if (rows.length) return hit;
    }
    for (const sn of wb.SheetNames) {
      const rows = getSheetRows(sn);
      const first = rows?.[0];
      if (!first) continue;
      const keys = Object.keys(normalizeHeaders(first));
      if (keys.includes("cpf") && (keys.includes("nomecompleto") || keys.includes("nome"))) return sn;
    }
    return null;
  };

  const programasRaw = getSheetRows("Programas");
  const turmasRaw = getSheetRows("Turmas");
  const cursosRaw = getSheetRows("Cursos");
  const programas = validateRows(programasRaw, ProgramaRowSchema, "Programas");
  const turmas = validateRows(turmasRaw, TurmaRowSchema, "Turmas");
  const cursos = validateRows(cursosRaw, CursoRowSchema, "Cursos");
  const participantesSheetName = detectParticipantesSheet();
  const participantesRaw = participantesSheetName ? getSheetRows(participantesSheetName) : [];
  const participantes = validateRows(participantesRaw, ParticipanteRowSchema, participantesSheetName || "Participantes");

  const count = (arr: any[]) => ({
    valid: arr.filter((r) => r.isValid).length,
    invalid: arr.filter((r) => !r.isValid).length,
  });

  return {
    programas, turmas, cursos, participantes,
    stats: {
      programas: count(programas),
      turmas: count(turmas),
      cursos: count(cursos),
      participantes: count(participantes),
    },
  };
}
