import type { Express, Request, Response, RequestHandler } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { z } from "zod";

const upload = multer({ storage: multer.memoryStorage() });

// ===== helpers =====
const onlyDigits = (v: unknown) => String(v ?? "").replace(/\D/g, "");
const isAllSameDigits = (s: string) => /^(\d)\1+$/.test(s);

function isValidCPF(raw: string) {
  const cpf = onlyDigits(raw);
  if (cpf.length !== 11) return false;
  if (isAllSameDigits(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(cpf[i]) * (10 - i);
  let d1 = 11 - (sum % 11);
  if (d1 >= 10) d1 = 0;
  if (d1 !== Number(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(cpf[i]) * (11 - i);
  let d2 = 11 - (sum % 11);
  if (d2 >= 10) d2 = 0;
  if (d2 !== Number(cpf[10])) return false;

  return true;
}

function isValidBRPhone(raw: string) {
  const phone = onlyDigits(raw);
  if (!(phone.length === 10 || phone.length === 11)) return false;
  if (isAllSameDigits(phone)) return false;
  return true;
}

function parseBool(v: any): boolean | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const s = String(v).trim().toLowerCase();
  if (["true", "1", "sim", "yes", "y"].includes(s)) return true;
  if (["false", "0", "nao", "não", "no", "n"].includes(s)) return false;
  return undefined;
}

function parseSimNao(v: any): "sim" | "nao" | undefined {
  if (v === null || v === undefined || v === "") return undefined;
  const s = String(v).trim().toLowerCase();
  if (["sim", "s", "yes", "true", "1"].includes(s)) return "sim";
  if (["nao", "não", "n", "no", "false", "0"].includes(s)) return "nao";
  return undefined;
}

function parseList(v: any): string[] | undefined {
  if (v === null || v === undefined || String(v).trim() === "") return undefined;
  return String(v)
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean);
}

const normalizeKey = (k: string) =>
  String(k ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-z0-9]+/g, "_"); // espaço, hífen etc -> _

function getCell(row: Record<string, any>, ...possibleKeys: string[]) {
  // cria um mapa de chaves normalizadas -> valor
  const map = new Map<string, any>();
  Object.keys(row).forEach((k) => map.set(normalizeKey(k), row[k]));

  for (const k of possibleKeys) {
    const v = map.get(normalizeKey(k));
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
}

const toStr = (v: any) => {
  const s = String(v ?? "").trim();
  return s === "" ? undefined : s;
};

const toDigits = (v: any) => {
  const s = onlyDigits(v);
  return s === "" ? undefined : s;
};

function normalizeUF(v: any): string | undefined {
  const s = String(v ?? "").trim().toUpperCase();
  if (!s) return undefined;
  // aceita "MG", "mg", "Minas Gerais" (se quiser mapear nomes depois)
  return s.length === 2 ? s : s;
}

function parseMoraDesdeAno(v: any): number | undefined {
  if (v === null || v === undefined || String(v).trim() === "") return undefined;
  const n = Number(String(v).replace(/[^\d]/g, ""));
  if (!Number.isFinite(n) || n <= 1900 || n > new Date().getFullYear()) return undefined;
  return n;
}

// XLSX dates can come as Date, number(serial), or string
function excelSerialToJSDate(serial: number): Date | null {
  if (!isFinite(serial)) return null;

  // Excel (sistema 1900): dia 1 = 1899-12-31, com bug do 1900-02-29 (serial 60)
  // Fórmula padrão: (serial - 25569) dias desde 1970-01-01
  // Ajuste do bug: se serial >= 60, subtrai 1 dia
  const s = serial >= 60 ? serial - 1 : serial;

  const utcMillis = Math.round((s - 25569) * 86400 * 1000);
  const d = new Date(utcMillis);
  if (isNaN(d.getTime())) return null;
  return d;
}

function normalizeGenero(v: any): "feminino" | "masculino" | "nao_binario" | "nao_informado" {
  const s = String(v ?? "").trim().toLowerCase();

  if (!s) return "nao_informado";

  // aceita variações comuns na planilha
  if (["f", "fem", "feminino", "mulher"].includes(s)) return "feminino";
  if (["m", "masc", "masculino", "homem"].includes(s)) return "masculino";
  if (["nao_binario", "não_binário", "nao binario", "não binario", "nb"].includes(s)) return "nao_binario";
  if (["nao_informado", "não informado", "nao informado", "prefiro não informar", "prefiro nao informar"].includes(s)) return "nao_informado";

  // fallback seguro
  return "nao_informado";
}

function parseDateToISO(v: any): string | undefined {
  if (v === null || v === undefined || v === "") return undefined;

  // 1) Date object (usar UTC para não “voltar 1 dia” por fuso)
  if (v instanceof Date && !isNaN(v.getTime())) {
    const yyyy = v.getUTCFullYear();
    const mm = String(v.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(v.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  // 2) Excel serial number
  if (typeof v === "number" && isFinite(v)) {
    const d = excelSerialToJSDate(v);
    if (!d) return undefined;

    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  // 3) Strings
  const s = String(v).trim();

  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // dd/mm/yyyy
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) {
    const dd = m[1];
    const mm = m[2];
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  return undefined;
}

// ===== Zod schema (espelho do seu formulário, mas já no formato "payload final") =====
const alunoImportSchema = z.object({
  cpf: z.string()
    .transform(onlyDigits)
    .refine((v) => v.length === 11, "CPF deve ter 11 dígitos")
    .refine(isValidCPF, "CPF inválido"),

  nome_completo: z.string().min(1, "Nome é obrigatório"),
  area: z.literal("pec"),

  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória"),
  genero: z.enum(["feminino", "masculino", "nao_binario", "nao_informado"]),

  telefone: z.string()
    .transform(onlyDigits)
    .refine((v) => v.length > 0, "Telefone é obrigatório")
    .refine(isValidBRPhone, "Telefone inválido"),

  data_entrada: z.string().min(1, "Data de entrada é obrigatória"),
  forma_acesso: z.string().min(1, "Forma de acesso é obrigatória"),

  // ===== ENDEREÇO (opcionais) =====
  cep: z.string().optional().transform((v) => (v ? onlyDigits(v) : undefined)),
  estado: z.string().optional().transform((v) => (v ? String(v).trim().toUpperCase() : undefined)),
  cidade: z.string().optional().transform((v) => (v ? String(v).trim() : undefined)),
  bairro: z.string().optional().transform((v) => (v ? String(v).trim() : undefined)),
  logradouro: z.string().optional().transform((v) => (v ? String(v).trim() : undefined)),
  numero: z.string().optional().transform((v) => (v ? String(v).trim() : undefined)),
  complemento: z.string().optional().transform((v) => (v ? String(v).trim() : undefined)),
  ponto_referencia: z.string().optional().transform((v) => (v ? String(v).trim() : undefined)),
  mora_desde_ano: z.number().optional(),
}).passthrough();


// ===== mapper row -> payload =====
function rowToAlunoPayload(row: Record<string, any>) {
  // base (obrigatórios)
  const cpf = onlyDigits(row.cpf);
  const telefone = onlyDigits(row.telefone);
    // ===== endereço (planilha -> payload) =====
  const cep = toDigits(getCell(row, "cep", "CEP"));
  const estado = normalizeUF(getCell(row, "estado", "uf", "UF", "Estado"));
  const cidade = toStr(getCell(row, "cidade", "Cidade", "localidade", "Localidade"));
  const bairro = toStr(getCell(row, "bairro", "Bairro"));
  const logradouro = toStr(getCell(row, "logradouro", "Logradouro", "rua", "Rua", "endereco", "Endereço"));
  const numero = toStr(getCell(row, "numero", "Número", "Numero", "n", "Nº", "nº"));
  const complemento = toStr(getCell(row, "complemento", "Complemento"));
  const ponto_referencia = toStr(getCell(row, "ponto_referencia", "Ponto de Referência", "ponto de referencia", "referencia", "Referência"));
  const mora_desde_ano = parseMoraDesdeAno(getCell(row, "mora_desde_ano", "Mora desde (ano)", "mora_desde", "Mora desde"));

  const telefone_whatsapp_bool = parseBool(row.telefone_whatsapp);
  const whatsapp = telefone_whatsapp_bool ? telefone : undefined;

  // telefones adicionais
  const telefones_adicionais = [1,2,3]
    .map((i) => {
      const numero = onlyDigits(row[`telefone_adicional_${i}_numero`]);
      const wpp = parseBool(row[`telefone_adicional_${i}_whatsapp`]) ?? false;
      if (!numero) return null;
      return { numero, whatsapp: wpp };
    })
    .filter(Boolean) as Array<{ numero: string; whatsapp: boolean }>;

  // contatos emergência
  const contatos_emergencia = [1,2,3]
    .map((i) => {
      const nome = String(row[`contato_emergencia_${i}_nome`] ?? "").trim();
      const tel = onlyDigits(row[`contato_emergencia_${i}_telefone`]);
      const wpp = parseBool(row[`contato_emergencia_${i}_whatsapp`]) ?? false;
      if (!nome && !tel) return null;
      if (!nome || !tel) return { __invalid: true, field: `contato_emergencia_${i}`, message: "Contato emergência precisa de nome e telefone" };
      return { nome, telefone: tel, whatsapp: wpp };
    })
    .filter(Boolean);

  // trabalhos atuais
  const trabalhos_atuais = [1,2,3]
    .map((i) => {
      const situacao = String(row[`trabalho_${i}_situacao`] ?? "").trim();
      const entrada = String(row[`trabalho_${i}_entrada`] ?? "").trim();
      const saida = String(row[`trabalho_${i}_saida`] ?? "").trim();
      const profissao = String(row[`trabalho_${i}_profissao`] ?? "").trim();
      const empresa = String(row[`trabalho_${i}_empresa`] ?? "").trim();
      const remuneracao = String(row[`trabalho_${i}_remuneracao`] ?? "").trim();
      const telefone = String(row[`trabalho_${i}_telefone`] ?? "").trim();

      // se não tem nada, ignora
      if (![situacao, entrada, saida, profissao, empresa, remuneracao, telefone].some(Boolean)) return null;

      return {
        situacao,
        entrada,
        saida: saida || undefined,
        profissao,
        empresa,
        remuneracao: remuneracao || undefined,
        telefone: telefone || undefined,
      };
    })
    .filter(Boolean);

  // experiências profissionais
  const experiencias_profissionais = [1,2,3]
    .map((i) => {
      const situacao = String(row[`experiencia_${i}_situacao`] ?? "").trim();
      const entrada = String(row[`experiencia_${i}_entrada`] ?? "").trim();
      const saida = String(row[`experiencia_${i}_saida`] ?? "").trim();
      const profissao = String(row[`experiencia_${i}_profissao`] ?? "").trim();
      const empresa = String(row[`experiencia_${i}_empresa`] ?? "").trim();
      const remuneracao = String(row[`experiencia_${i}_remuneracao`] ?? "").trim();

      if (![situacao, entrada, saida, profissao, empresa, remuneracao].some(Boolean)) return null;

      return { situacao, entrada, saida, profissao, empresa, remuneracao: remuneracao || undefined };
    })
    .filter(Boolean);

  // relações
  const relacionamentos_familiares = [1,2,3,4,5]
    .map((i) => {
      const nome = String(row[`rel_familiar_${i}_nome`] ?? "").trim();
      const parentesco = String(row[`rel_familiar_${i}_parentesco`] ?? "").trim();
      const relacao = String(row[`rel_familiar_${i}_relacao`] ?? "").trim();
      if (!nome && !parentesco && !relacao) return null;
      return { nome, parentesco, relacao };
    })
    .filter(Boolean);

  const outros_relacionamentos = [1,2,3,4,5]
    .map((i) => {
      const nome = String(row[`rel_outros_${i}_nome`] ?? "").trim();
      const parentesco = String(row[`rel_outros_${i}_parentesco`] ?? "").trim();
      const relacao = String(row[`rel_outros_${i}_relacao`] ?? "").trim();
      if (!nome && !parentesco && !relacao) return null;
      return { nome, parentesco, relacao };
    })
    .filter(Boolean);

  // contatos saúde (obj único)
  const contatos_saude_nome = String(row.contatos_saude_nome ?? "").trim();
  const contatos_saude_telefone = onlyDigits(row.contatos_saude_telefone);
  const contatos_saude =
    contatos_saude_nome || contatos_saude_telefone
      ? { nome: contatos_saude_nome, telefone: contatos_saude_telefone }
      : undefined;

  // arrays via ;
  const documentos_possui = parseList(row.documentos_possui);
  const demandas = parseList(row.demandas);
  const turno_escolar = parseList(row.turno_escolar) as any;
  const ja_teve_ou_costuma_ter = parseList(row.ja_teve_ou_costuma_ter) as any;

  // datas
  const data_nascimento = parseDateToISO(row.data_nascimento);
  const data_entrada = parseDateToISO(row.data_entrada);

  // sim/nao fields
  const pode_sair_sozinho = parseSimNao(row.pode_sair_sozinho);
  const frequenta_projeto_social = parseSimNao(row.frequenta_projeto_social);
  const acesso_internet = parseSimNao(row.acesso_internet);

  const cadunico = parseSimNao(row.cadunico);
  const bolsa_familia = parseSimNao(row.bolsa_familia);
  const bpc = parseSimNao(row.bpc);
  const cartao_alimentacao = parseSimNao(row.cartao_alimentacao);
  const outros_beneficios = parseSimNao(row.outros_beneficios);

  const restricao_alimentar = parseSimNao(row.restricao_alimentar);
  const possui_convenio_medico = parseSimNao(row.possui_convenio_medico);
  const historico_medico = parseSimNao(row.historico_medico);

  // payload final (espelha seu formattedData)
  const payload: any = {
    cpf,
    nome_completo: String(row.nome_completo ?? "").trim(),
    area: "pec",

    foto_perfil: row.foto_perfil ? String(row.foto_perfil).trim() : undefined,
    numero_matricula: row.numero_matricula ? String(row.numero_matricula).trim() : undefined,

    data_nascimento: data_nascimento ?? "",
    genero: normalizeGenero(row.genero),

    estado_civil: row.estado_civil ? String(row.estado_civil).trim() : undefined,
    religiao: row.religiao ? String(row.religiao).trim() : undefined,
    naturalidade: row.naturalidade ? String(row.naturalidade).trim() : undefined,
    nacionalidade: row.nacionalidade ? String(row.nacionalidade).trim() : "Brasil",

    pode_sair_sozinho,
    tamanho_calca: row.tamanho_calca ? String(row.tamanho_calca).trim() : undefined,
    tamanho_camiseta: row.tamanho_camiseta ? String(row.tamanho_camiseta).trim() : undefined,
    tamanho_calcado: row.tamanho_calcado ? String(row.tamanho_calcado).trim() : undefined,
    cor_raca: row.cor_raca ? String(row.cor_raca).trim() : undefined,

    frequenta_projeto_social,
    projeto_social_qual: row.projeto_social_qual ? String(row.projeto_social_qual).trim() : undefined,

    acesso_internet,
    internet_qual: row.internet_qual ? String(row.internet_qual).trim() : undefined,

    // documentos
    rg: row.rg ? onlyDigits(row.rg) : undefined,
    orgao_emissor: row.orgao_emissor ? String(row.orgao_emissor).trim() : undefined,
    ctps_numero: row.ctps_numero ? String(row.ctps_numero).trim() : undefined,
    ctps_serie: row.ctps_serie ? String(row.ctps_serie).trim() : undefined,
    titulo_eleitor: row.titulo_eleitor ? String(row.titulo_eleitor).trim() : undefined,
    nis_pis_pasep: row.nis_pis_pasep ? String(row.nis_pis_pasep).trim() : undefined,
    documentos_possui: documentos_possui ?? [],

    // contato
    email: row.email ? String(row.email).trim() : undefined,
    telefone,
    whatsapp,
    telefones_adicionais,
    contatos_emergencia: Array.isArray(contatos_emergencia) ? contatos_emergencia.filter((x: any) => !x?.__invalid) : [],

    // Endereço
    cep,
    estado,
    cidade,
    bairro,
    logradouro,
    numero,
    complemento,
    ponto_referencia,
    mora_desde_ano,

    // benefícios
    cadunico,
    bolsa_familia,
    bpc,
    cartao_alimentacao,
    outros_beneficios,

    // adicionais
    data_entrada: data_entrada ?? "",
    forma_acesso: row.forma_acesso ? String(row.forma_acesso).trim() : "",
    demandas: demandas ?? [],
    observacoes_gerais: row.observacoes_gerais ? String(row.observacoes_gerais).trim() : undefined,

    // escolar
    serie: row.serie ? String(row.serie).trim() : undefined,
    situacao_escolar: row.situacao_escolar ? String(row.situacao_escolar).trim() : undefined,
    turno_escolar: turno_escolar ?? [],
    instituicao_ensino: row.instituicao_ensino ? String(row.instituicao_ensino).trim() : undefined,
    e_alfabetizado: row.e_alfabetizado ? String(row.e_alfabetizado).trim() : undefined,
    bairro_escola: row.bairro_escola ? String(row.bairro_escola).trim() : undefined,

    // profissional
    trabalhos_atuais,
    experiencias_profissionais,

    // saúde
    possui_particularidade_saude: row.possui_particularidade_saude ? String(row.possui_particularidade_saude).trim() : undefined,
    detalhes_particularidade: row.detalhes_particularidade ? String(row.detalhes_particularidade).trim() : undefined,
    possui_alergia: row.possui_alergia ? String(row.possui_alergia).trim() : undefined,
    detalhes_alergia: row.detalhes_alergia ? String(row.detalhes_alergia).trim() : undefined,
    faz_uso_medicamento: row.faz_uso_medicamento ? String(row.faz_uso_medicamento).trim() : undefined,
    detalhes_medicamento: row.detalhes_medicamento ? String(row.detalhes_medicamento).trim() : undefined,
    possui_deficiencia: row.possui_deficiencia ? String(row.possui_deficiencia).trim() : undefined,
    detalhes_deficiencia: row.detalhes_deficiencia ? String(row.detalhes_deficiencia).trim() : undefined,
    contatos_saude,
    faz_uso_quimicos: row.faz_uso_quimicos ? String(row.faz_uso_quimicos).trim() : undefined,
    familiar_usa_quimicos: row.familiar_usa_quimicos ? String(row.familiar_usa_quimicos).trim() : undefined,
    tipo_sanguineo: row.tipo_sanguineo ? String(row.tipo_sanguineo).trim() : undefined,
    restricao_alimentar,
    detalhes_restricao_alimentar: row.detalhes_restricao_alimentar ? String(row.detalhes_restricao_alimentar).trim() : undefined,
    possui_convenio_medico,
    detalhes_convenio_medico: row.detalhes_convenio_medico ? String(row.detalhes_convenio_medico).trim() : undefined,
    historico_medico,
    ja_teve_ou_costuma_ter: ja_teve_ou_costuma_ter ?? [],
    detalhes_historico_medico: row.detalhes_historico_medico ? String(row.detalhes_historico_medico).trim() : undefined,

    // relações
    relacionamentos_familiares,
    outros_relacionamentos,
  };

  // erros extras (ex: contato_emergencia inválido)
  const extraErrors: Array<{ field: string; message: string }> = [];
  (contatos_emergencia as any[]).forEach((c: any) => {
    if (c?.__invalid) extraErrors.push({ field: c.field, message: c.message });
  });

  return { payload, extraErrors };
}

// ===== main register =====
export function registerPecImportRoutes(
  app: Express,
  storage: any,
  ...authGuards: RequestHandler[]
) {
  // PREVIEW
  app.post(
    "/api/pec/import/alunos/preview",
    ...authGuards,
    upload.single("file"),
    async (req: Request, res: Response) => {
    try {
      if (!req.file?.buffer) return res.status(400).json({ error: "Arquivo não enviado" });

      const wb = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheetName = wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];

      // defval: "" garante chave existindo mesmo vazia
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

      const results = rows.map((row, idx) => {
        const rowNumber = idx + 2; // linha 1 é header

        const { payload, extraErrors } = rowToAlunoPayload(row);
        const parsed = alunoImportSchema.safeParse(payload);

        const errors: Array<{ field: string; message: string }> = [];

        if (!parsed.success) {
          parsed.error.issues.forEach((iss) => {
            errors.push({ field: String(iss.path?.[0] ?? "geral"), message: iss.message });
          });
        }

        extraErrors.forEach((e) => errors.push(e));

        return {
          rowNumber,
          cpf: payload.cpf,
          nome_completo: payload.nome_completo,
          ok: errors.length === 0,
          errors,
          payload, // já pronto pro commit
        };
      });

      // duplicados dentro da planilha
      const cpfCount = new Map<string, number>();
      results.forEach((r) => {
        if (!r.cpf) return;
        cpfCount.set(r.cpf, (cpfCount.get(r.cpf) ?? 0) + 1);
      });
      results.forEach((r) => {
        if (r.cpf && (cpfCount.get(r.cpf) ?? 0) > 1) {
          r.ok = false;
          r.errors.push({ field: "cpf", message: "CPF duplicado dentro da planilha" });
        }
      });

      // (Opcional) checar duplicado no banco:
      // se você tiver storage.getAlunoByCpf(cpf) use aqui.
      // Eu deixei pro commit pular com segurança.

      const summary = {
        total: results.length,
        valid: results.filter((r) => r.ok).length,
        invalid: results.filter((r) => !r.ok).length,
      };

      res.json({ summary, results });
    } catch (err: any) {
      console.error("PEC import preview error:", err);
      res.status(500).json({ error: "Falha ao processar planilha" });
    }
  });

  // COMMIT
  app.post(
    "/api/pec/import/alunos/commit",
    ...authGuards,
    async (req: Request, res: Response) => {
    try {
      const { rows } = req.body as { rows: Array<{ rowNumber: number; payload: any }> };
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: "Nenhuma linha enviada para importação" });
      }

      const inserted: any[] = [];
      const skipped: any[] = [];
      const failed: any[] = [];

      for (const r of rows) {
        const payload = { ...(r.payload ?? {}), area: "pec" };

        // valida de novo
        const parsed = alunoImportSchema.safeParse(payload);
        if (!parsed.success) {
          failed.push({
            rowNumber: r.rowNumber,
            cpf: payload.cpf,
            nome_completo: payload.nome_completo,
            error: parsed.error.issues.map((i) => ({ field: i.path?.[0], message: i.message })),
          });
          continue;
        }

        // checar se já existe
        const exists = await storage.getAluno(payload.cpf);
        if (exists) {
        skipped.push({ rowNumber: r.rowNumber, cpf: payload.cpf, reason: "CPF já existe no banco" });
        continue;
        }

        // consolidação (igual seu endpoint)
        try {
          if (payload.telefone && payload.nome_completo) {
            const { consolidateUser } = await import("./userConsolidation");
            await consolidateUser({
              nome: payload.nome_completo,
              telefone: payload.telefone,
              email: payload.email,
              cpf: payload.cpf,
              tipo: "aluno",
              fonte: "educacao",
            });
          }
        } catch (e) {
          // não impede importar aluno, só loga
          console.error("Erro na consolidação (import):", e);
        }

        try {
          const aluno = await storage.createAluno(payload);
          inserted.push({ rowNumber: r.rowNumber, cpf: payload.cpf, id: aluno?.id ?? null });
        } catch (e: any) {
          failed.push({ rowNumber: r.rowNumber, cpf: payload.cpf, error: e?.message ?? "Falha ao inserir" });
        }
      }

      res.json({
        summary: {
          requested: rows.length,
          inserted: inserted.length,
          skipped: skipped.length,
          failed: failed.length,
        },
        inserted,
        skipped,
        failed,
      });
    } catch (err: any) {
      console.error("PEC import commit error:", err);
      res.status(500).json({ error: "Falha ao importar alunos" });
    }
  });
}
