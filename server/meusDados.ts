import type { Pool } from "pg";

export type LegalAcceptanceRow = {
  document_type: string;
  document_version: string;
  accepted_at: string;
  source?: string;
};

export type StaffKind = "coordenador" | "professor" | "monitor";

/** Perfil lógico para exportação LGPD (define quais blocos entram no JSON). */
export type MeusDadosProfile = "aluno" | "staff" | "patrocinador" | "doador" | "conta";

export type MeusDadosContext = {
  usersId: number | null;
  cpf?: string;
  actorType?: string;
  exportKey: string;
  staffKind?: StaffKind;
  staffId?: number | null;
  email?: string | null;
};

const SENSITIVE_ALUNO_KEYS = new Set([
  "senha",
  "password",
  "password_hash",
  "passwordhash",
]);

async function safeQuery<T = Record<string, unknown>>(
  pool: Pool,
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  try {
    const result = await pool.query<T>(sql, params);
    return result.rows;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[meus-dados] Query ignorada:", message);
    return [];
  }
}

export function normalizeCpfDigits(raw: unknown): string {
  return String(raw ?? "").replace(/\D/g, "");
}

export function isAlunoMeusDadosActor(actorType?: string, papel?: string): boolean {
  const a = (actorType || "").toLowerCase();
  const p = (papel || "").toLowerCase();
  return (
    a === "aluno" ||
    a === "aluno_portal" ||
    p === "aluno" ||
    p === "aluno_portal"
  );
}

function isCoordenadorActor(actorType: string, papel: string): boolean {
  const a = actorType.toLowerCase();
  const p = papel.toLowerCase();
  return a === "coordenador" || p.startsWith("coordenador_") || p === "tecnica_psico";
}

function isProfessorActor(actorType: string, papel: string): boolean {
  const a = actorType.toLowerCase();
  const p = papel.toLowerCase();
  return a === "professor" || p.startsWith("professor_") || p === "professor_lider" || p === "lider";
}

function isMonitorActor(actorType: string, papel: string): boolean {
  const a = actorType.toLowerCase();
  const p = papel.toLowerCase();
  return a === "monitor" || p.startsWith("monitor_");
}

function isPatrocinadorActor(actorType: string, papel: string): boolean {
  const a = actorType.toLowerCase();
  const p = papel.toLowerCase();
  return a === "patrocinador" || p === "patrocinador";
}

/** Define o “pacote” de dados do titular conforme o login atual. */
export function resolveMeusDadosProfile(context: MeusDadosContext): MeusDadosProfile {
  if (context.cpf) return "aluno";
  if (context.staffKind) return "staff";
  if (context.actorType === "patrocinador") return "patrocinador";
  const actor = (context.actorType || "").toLowerCase();
  if (actor === "doador" || actor === "user") return "doador";
  return "conta";
}

export function shouldIncludeDonationData(profile: MeusDadosProfile): boolean {
  return profile === "doador";
}

const DONOR_ONLY_USER_KEYS = new Set([
  "plano",
  "subscription_status",
  "stripe_customer_id",
  "stripe_subscription_id",
]);

/** Remove campos de assinatura Stripe quando o export não é de doador. */
export function sanitizeUsuarioForProfile(
  usuario: Record<string, unknown> | null,
  profile: MeusDadosProfile
): Record<string, unknown> | null {
  if (!usuario) return null;
  if (profile === "doador") return usuario;
  const copy = { ...usuario };
  for (const key of DONOR_ONLY_USER_KEYS) {
    delete copy[key];
  }
  return copy;
}

/** Resolve users.id + CPF a partir da sessão (aluno usa CPF, demais usam users.id). */
export async function resolveMeusDadosContext(req: {
  user?: {
    id?: unknown;
    cpf?: unknown;
    actorType?: string;
    role?: string;
    papel?: string;
    participanteId?: number | null;
    professorId?: number | null;
    monitorId?: number | null;
    email?: string | null;
  };
  session?: unknown;
}): Promise<MeusDadosContext | null> {
  const user = req.user;
  if (!user?.id && user?.id !== 0) return null;

  const actorType = String(user.actorType || user.role || user.papel || "");
  const papel = String(user.papel || user.role || actorType);
  const email = user.email ? String(user.email).trim() : null;
  const { resolvePrivacyConsentUserId, resolveUsersIdForTermosAceite, ensureStaffUsersLink } =
    await import("./privacyConsentUser");

  if (isAlunoMeusDadosActor(actorType, papel)) {
    const cpf = normalizeCpfDigits(user.cpf) || normalizeCpfDigits(user.id);
    if (cpf.length !== 11) return null;
    const usersId = await resolvePrivacyConsentUserId(req);
    return {
      usersId,
      cpf,
      actorType: actorType || "aluno",
      exportKey: `aluno-${cpf.slice(-4)}`,
      email,
    };
  }

  const rawId = user.id;
  const numericFromRaw =
    typeof rawId === "number"
      ? rawId
      : typeof rawId === "string"
        ? Number(normalizeCpfDigits(rawId).length === 11 ? NaN : rawId)
        : NaN;

  if (isCoordenadorActor(actorType, papel)) {
    const coordId = Number.isFinite(numericFromRaw) && numericFromRaw > 0 ? numericFromRaw : null;
    if (!coordId) return null;
    const usersId = await resolveUsersIdForTermosAceite("coordenador", coordId);
    return {
      usersId,
      actorType: "coordenador",
      staffKind: "coordenador",
      staffId: coordId,
      email,
      exportKey: `coord-${coordId}`,
    };
  }

  if (isProfessorActor(actorType, papel)) {
    let usersId = Number.isFinite(numericFromRaw) && numericFromRaw > 0 ? numericFromRaw : null;
    const staffId =
      typeof user.professorId === "number" && user.professorId > 0 ? user.professorId : null;
    if (!usersId && staffId) {
      usersId = await ensureStaffUsersLink("professores", staffId);
    }
    return {
      usersId,
      actorType: "professor",
      staffKind: "professor",
      staffId,
      email,
      exportKey: String(usersId || staffId || "professor"),
    };
  }

  if (isMonitorActor(actorType, papel)) {
    let usersId = Number.isFinite(numericFromRaw) && numericFromRaw > 0 ? numericFromRaw : null;
    const staffId = typeof user.monitorId === "number" && user.monitorId > 0 ? user.monitorId : null;
    if (!usersId && staffId) {
      usersId = await ensureStaffUsersLink("monitores", staffId);
    }
    return {
      usersId,
      actorType: "monitor",
      staffKind: "monitor",
      staffId,
      email,
      exportKey: String(usersId || staffId || "monitor"),
    };
  }

  if (isPatrocinadorActor(actorType, papel)) {
    const usersId = Number.isFinite(numericFromRaw) && numericFromRaw > 0 ? numericFromRaw : null;
    return {
      usersId,
      actorType: "patrocinador",
      email,
      exportKey: String(usersId || "patrocinador"),
    };
  }

  if (typeof rawId === "string") {
    const cpf = normalizeCpfDigits(rawId);
    if (cpf.length === 11) {
      const usersId = await resolvePrivacyConsentUserId(req);
      return {
        usersId,
        cpf,
        actorType: actorType || "aluno",
        exportKey: `aluno-${cpf.slice(-4)}`,
        email,
      };
    }
  }

  if (Number.isFinite(numericFromRaw) && numericFromRaw > 0) {
    return { usersId: numericFromRaw, actorType, email, exportKey: String(numericFromRaw) };
  }

  return null;
}

function stripSensitiveFields(row: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!row) return null;
  const copy = { ...row };
  for (const key of Object.keys(copy)) {
    if (SENSITIVE_ALUNO_KEYS.has(key.toLowerCase())) {
      delete copy[key];
    }
  }
  return copy;
}

export function buildUsuarioFromAlunoFicha(
  ficha: Record<string, unknown> | null,
  cpf: string,
  usersRow: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!ficha && !usersRow) return null;
  if (usersRow) {
    return {
      ...usersRow,
      cpf: usersRow.cpf || cpf,
      nome: usersRow.nome || ficha?.nome_completo || ficha?.nome || null,
      email: usersRow.email || ficha?.email || null,
      telefone: usersRow.telefone || ficha?.telefone || ficha?.whatsapp || null,
    };
  }
  return {
    nome: ficha?.nome_completo || ficha?.nome || null,
    email: ficha?.email || null,
    telefone: ficha?.telefone || ficha?.whatsapp || null,
    cpf,
    created_at: ficha?.created_at ?? null,
    updated_at: ficha?.updated_at ?? null,
  };
}

export function mergeAlunoTermosIntoAceites(
  aceites: LegalAcceptanceRow[],
  ficha: { termos_uso_aceito_em?: string | null; termos_uso_versao?: string | null } | null
): LegalAcceptanceRow[] {
  if (!ficha?.termos_uso_aceito_em) return aceites;
  if (aceites.some((r) => r.document_type === "terms")) return aceites;
  return [
    ...aceites,
    {
      document_type: "terms",
      document_version: ficha.termos_uso_versao || "—",
      accepted_at: String(ficha.termos_uso_aceito_em),
      source: "aluno.termos_uso",
    },
  ].sort((a, b) => new Date(b.accepted_at).getTime() - new Date(a.accepted_at).getTime());
}

function parsePecAttendanceStatus(attendance: unknown, cpf: string): string | null {
  if (!attendance) return null;
  if (Array.isArray(attendance)) {
    const entry = attendance.find((a: Record<string, unknown>) => {
      const cpfEntry = normalizeCpfDigits(a.alunoCpf || a.cpf);
      return cpfEntry === cpf;
    }) as Record<string, unknown> | undefined;
    if (!entry) return null;
    return String(entry.status || (entry.presente ? "presente" : "ausente"));
  }
  if (typeof attendance === "object") {
    const att = attendance as Record<string, unknown>;
    const matchKey = Object.keys(att).find((k) => normalizeCpfDigits(k) === cpf);
    if (!matchKey) return null;
    const val = att[matchKey];
    if (val && typeof val === "object" && "status" in (val as object)) {
      return String((val as { status: unknown }).status);
    }
    return String(val ?? "presente");
  }
  return null;
}

async function fetchAlunoFichaByCpf(pool: Pool, cpf: string) {
  const [pecRows, inclRows] = await Promise.all([
    safeQuery<Record<string, unknown>>(
      pool,
      `SELECT * FROM aluno WHERE REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = $1 LIMIT 1`,
      [cpf]
    ),
    safeQuery<Record<string, unknown>>(
      pool,
      `SELECT * FROM participantes_inclusao
        WHERE REGEXP_REPLACE(cpf, '[^0-9]', '', 'g') = $1
          AND status IS DISTINCT FROM 'evadido'
        LIMIT 1`,
      [cpf]
    ),
  ]);

  const fichaPec = stripSensitiveFields(pecRows[0] ?? null);
  const fichaInclusao = stripSensitiveFields(inclRows[0] ?? null);
  const programa =
    fichaPec ? "pec" : fichaInclusao ? "inclusao" : null;

  return { fichaPec, fichaInclusao, programa };
}

async function fetchAlunoCursosByCpf(pool: Pool, cpf: string) {
  const cursos: Record<string, unknown>[] = [];

  const pecEnroll = await safeQuery<Record<string, unknown>>(
    pool,
    `SELECT ai.id, ai.title as nome, ai.period_label as turno,
            ai.start_time, ai.end_time, ai.occurrence_start, ai.occurrence_end,
            ai.location, ai.situation as status, ai.dias_semana,
            ie.enrollment_date, ie.active, ie.evadido
       FROM instance_enrollments ie
       JOIN activity_instances ai ON ai.id = ie.activity_instance_id
      WHERE REGEXP_REPLACE(ie.student_cpf, '[^0-9]', '', 'g') = $1
      ORDER BY ie.enrollment_date DESC`,
    [cpf]
  );

  for (const r of pecEnroll) {
    const diasSemana = Array.isArray(r.dias_semana)
      ? (r.dias_semana as string[]).map((d) =>
          d.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        )
      : [];
    cursos.push({
      id: r.id,
      nome: r.nome,
      area: "pec",
      turno: r.turno,
      horarioEntrada: r.start_time,
      horarioSaida: r.end_time,
      diasSemana,
      dataInicio: r.occurrence_start,
      dataFim: r.occurrence_end,
      local: r.location,
      status: r.evadido ? "evadido" : r.active ? "ativo" : "concluido",
      dataMatricula: r.enrollment_date,
    });
  }

  const inclPart = await safeQuery<Record<string, unknown>>(
    pool,
    `SELECT ti.id, pi.nome as programa, ti.nome as turma,
            ti.horario_entrada, ti.horario_saida, ti.dias_semana,
            ti.data_inicio, ti.data_fim, ti.status, ti.local,
            pt.data_inscricao
       FROM participantes_inclusao p
       JOIN participantes_turmas pt ON pt.participante_id = p.id
       JOIN turmas_inclusao ti ON ti.id = pt.turma_id
       JOIN programas_inclusao pi ON pi.id = ti.programa_id
      WHERE REGEXP_REPLACE(p.cpf, '[^0-9]', '', 'g') = $1
      ORDER BY pt.data_inscricao DESC`,
    [cpf]
  );

  for (const r of inclPart) {
    cursos.push({
      id: r.id,
      nome: `${r.programa}${r.turma ? ` — ${r.turma}` : ""}`,
      area: "inclusao",
      turno: null,
      horarioEntrada: r.horario_entrada,
      horarioSaida: r.horario_saida,
      diasSemana: r.dias_semana,
      dataInicio: r.data_inicio,
      dataFim: r.data_fim,
      local: r.local,
      status: r.status === "emandamento" ? "ativo" : r.status || "ativo",
      dataMatricula: r.data_inscricao,
    });
  }

  return cursos;
}

async function fetchAlunoFrequenciaByCpf(pool: Pool, cpf: string, limit: number) {
  const resultado: Array<Record<string, unknown>> = [];

  const pecSessions = await safeQuery<Record<string, unknown>>(
    pool,
    `SELECT s.date, s.title, ai.title as turma, s.attendance
       FROM instance_enrollments ie
       JOIN activity_instances ai ON ai.id = ie.activity_instance_id
       JOIN sessions s ON s.activity_instance_id = ie.activity_instance_id
      WHERE REGEXP_REPLACE(ie.student_cpf, '[^0-9]', '', 'g') = $1
        AND s.attendance IS NOT NULL
      ORDER BY s.date DESC`,
    [cpf]
  );

  for (const row of pecSessions) {
    let status = parsePecAttendanceStatus(row.attendance, cpf);
    if (status === null) continue;
    if (status === "falta_justificada" || status === "justificada") continue;
    resultado.push({
      data: row.date,
      turma: row.turma || row.title,
      area: "pec",
      status: status === "presente" ? "presente" : "falta",
    });
  }

  const inclPresencas = await safeQuery<Record<string, unknown>>(
    pool,
    `SELECT pres.data, pres.presente, pres.conta_como_presenca,
            ti.nome as turma_nome, prog.nome as programa_nome
       FROM presencas_inclusao pres
       JOIN participantes_inclusao part ON part.id = pres.participante_id
       LEFT JOIN turmas_inclusao ti ON ti.id = pres.turma_id
       LEFT JOIN programas_inclusao prog ON prog.id = ti.programa_id
      WHERE REGEXP_REPLACE(part.cpf, '[^0-9]', '', 'g') = $1
      ORDER BY pres.data DESC`,
    [cpf]
  );

  for (const row of inclPresencas) {
    const ePresente = row.presente === true || row.conta_como_presenca === true;
    resultado.push({
      data: row.data,
      turma: row.programa_nome || row.turma_nome || "Inclusão Produtiva",
      area: "inclusao",
      status: ePresente ? "presente" : "falta",
    });
  }

  const inclAula = await safeQuery<Record<string, unknown>>(
    pool,
    `SELECT pa.status, a.data, a.nome as aula_nome,
            ti.nome as turma_nome, prog.nome as programa_nome
       FROM presencas_aula pa
       JOIN aulas a ON a.id = pa.aula_id
       LEFT JOIN turmas_inclusao ti ON ti.id = a.turma_id
       LEFT JOIN programas_inclusao prog ON prog.id = ti.programa_id
      WHERE REGEXP_REPLACE(pa.cpf, '[^0-9]', '', 'g') = $1
      ORDER BY a.data DESC`,
    [cpf]
  );

  for (const row of inclAula) {
    resultado.push({
      data: row.data,
      turma: row.programa_nome || row.turma_nome || row.aula_nome || "Inclusão Produtiva",
      area: "inclusao",
      status: row.status === "presente" || row.status == null ? "presente" : "falta",
    });
  }

  resultado.sort((a, b) => {
    const da = new Date(String(a.data || 0)).getTime();
    const db = new Date(String(b.data || 0)).getTime();
    return db - da;
  });

  return resultado.slice(0, limit);
}

async function fetchAlunoResponsaveisByCpf(pool: Pool, cpf: string) {
  return safeQuery(
    pool,
    `SELECT r.id, r.cpf, r.nome_completo, r.grau_parentesco, r.profissao, r.telefone,
            ar.e_principal, ar.created_at as vinculo_desde
       FROM aluno_responsaveis ar
       JOIN responsaveis r ON r.id = ar.responsavel_id
      WHERE REGEXP_REPLACE(ar.aluno_cpf, '[^0-9]', '', 'g') = $1
      ORDER BY ar.e_principal DESC, ar.created_at ASC`,
    [cpf]
  );
}

async function fetchStaffFicha(
  pool: Pool,
  kind: StaffKind,
  staffId: number | null,
  usersId: number | null,
  email: string | null
): Promise<Record<string, unknown> | null> {
  const table =
    kind === "coordenador" ? "coordenadores" : kind === "professor" ? "professores" : "monitores";

  if (staffId) {
    const byId = await safeQuery<Record<string, unknown>>(
      pool,
      `SELECT * FROM ${table} WHERE id = $1 LIMIT 1`,
      [staffId]
    );
    if (byId[0]) return stripSensitiveFields(byId[0]);
  }

  if (email) {
    const byEmail = await safeQuery<Record<string, unknown>>(
      pool,
      `SELECT * FROM ${table} WHERE lower(trim(email)) = lower(trim($1)) LIMIT 1`,
      [email]
    );
    if (byEmail[0]) return stripSensitiveFields(byEmail[0]);
  }

  if (usersId) {
    const byUser = await safeQuery<Record<string, unknown>>(
      pool,
      `SELECT t.* FROM ${table} t
        JOIN users u ON lower(trim(u.email)) = lower(trim(t.email))
       WHERE u.id = $1 LIMIT 1`,
      [usersId]
    );
    if (byUser[0]) return stripSensitiveFields(byUser[0]);
  }

  return null;
}

const PATROCINADOR_FICHA_SELECT = `id, nome, ano, tipo, categoria, valor_patrocinio, status,
            projetos_ativos, contratos_ativos, data_inicio, data_fim, observacoes, email,
            created_at, updated_at`;

async function fetchPatrocinadorForMeusDados(
  pool: Pool,
  email: string | null,
  nome: string | null,
  usersId: number | null
) {
  if (email?.trim()) {
    const byEmail = await safeQuery<Record<string, unknown>>(
      pool,
      `SELECT ${PATROCINADOR_FICHA_SELECT}
         FROM patrocinadores
        WHERE lower(trim(email)) = lower(trim($1))
        LIMIT 1`,
      [email]
    );
    if (byEmail[0]) return byEmail[0];
  }

  if (usersId != null) {
    const byUser = await safeQuery<Record<string, unknown>>(
      pool,
      `SELECT p.id, p.nome, p.ano, p.tipo, p.categoria, p.valor_patrocinio, p.status,
              p.projetos_ativos, p.contratos_ativos, p.data_inicio, p.data_fim, p.observacoes, p.email,
              p.created_at, p.updated_at
         FROM patrocinadores p
         JOIN users u ON lower(trim(p.email)) = lower(trim(u.email))
        WHERE u.id = $1
        LIMIT 1`,
      [usersId]
    );
    if (byUser[0]) return byUser[0];
  }

  if (nome?.trim()) {
    const byNome = await safeQuery<Record<string, unknown>>(
      pool,
      `SELECT ${PATROCINADOR_FICHA_SELECT}
         FROM patrocinadores
        WHERE lower(trim(nome)) = lower(trim($1))
        LIMIT 1`,
      [nome]
    );
    if (byNome[0]) return byNome[0];
  }

  return null;
}

export function buildUsuarioFromStaffFicha(
  ficha: Record<string, unknown> | null,
  usersRow: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!ficha && !usersRow) return null;
  if (usersRow) {
    return {
      ...usersRow,
      nome: usersRow.nome || ficha?.nome || null,
      email: usersRow.email || ficha?.email || null,
      telefone: usersRow.telefone || ficha?.telefone || null,
    };
  }
  return {
    nome: ficha?.nome || null,
    email: ficha?.email || null,
    telefone: ficha?.telefone || null,
    created_at: ficha?.created_at ?? null,
    updated_at: ficha?.updated_at ?? null,
  };
}

export function mergeStaffTermosIntoAceites(
  aceites: LegalAcceptanceRow[],
  ficha: { termos_uso_aceito_em?: string | null; termos_uso_versao?: string | null } | null,
  source: string
): LegalAcceptanceRow[] {
  if (!ficha?.termos_uso_aceito_em) return aceites;
  if (aceites.some((r) => r.document_type === "terms")) return aceites;
  return [
    ...aceites,
    {
      document_type: "terms",
      document_version: ficha.termos_uso_versao || "—",
      accepted_at: String(ficha.termos_uso_aceito_em),
      source,
    },
  ].sort((a, b) => new Date(b.accepted_at).getTime() - new Date(a.accepted_at).getTime());
}

/** Garante tabelas do portal LGPD (idempotente). */
export async function ensureMeusDadosTables(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_legal_acceptances (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      document_type VARCHAR(50) NOT NULL,
      document_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
      ip_address VARCHAR(100),
      user_agent TEXT,
      accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_user_legal_acceptances_user_id ON user_legal_acceptances(user_id)
  `).catch(() => {});

  await pool.query(`
    CREATE TABLE IF NOT EXISTS privacy_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      request_type VARCHAR(50) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      description TEXT,
      response TEXT,
      requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_privacy_requests_user_id ON privacy_requests(user_id)
  `).catch(() => {});
}

export async function recordLegalAcceptance(
  pool: Pool,
  params: {
    userId: number | null;
    documentType: "terms" | "privacy_policy";
    documentVersion: string;
    ip?: string | null;
    userAgent?: string | null;
  }
): Promise<void> {
  if (!params.userId) return;
  await ensureMeusDadosTables(pool);
  await pool.query(
    `INSERT INTO user_legal_acceptances (user_id, document_type, document_version, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [params.userId, params.documentType, params.documentVersion, params.ip ?? null, params.userAgent ?? null]
  );
}

export function mergeLegalAcceptances(
  rows: LegalAcceptanceRow[],
  usuario: { termos_uso_aceito_em?: string | null; termos_uso_versao?: string | null } | null,
  privacyRows: Array<{ terms_version?: string | null; privacy_policy_version?: string | null; updated_at?: string }>
): LegalAcceptanceRow[] {
  const merged = [...rows];

  const hasTerms = merged.some((r) => r.document_type === "terms");
  if (!hasTerms && usuario?.termos_uso_aceito_em) {
    merged.push({
      document_type: "terms",
      document_version: usuario.termos_uso_versao || "—",
      accepted_at: usuario.termos_uso_aceito_em,
      source: "users.termos_uso",
    });
  }

  const latestPrivacy = privacyRows[0];
  const hasPrivacyDoc = merged.some((r) => r.document_type === "privacy_policy");
  if (!hasPrivacyDoc && latestPrivacy?.updated_at) {
    merged.push({
      document_type: "privacy_policy",
      document_version: latestPrivacy.privacy_policy_version || "1.0",
      accepted_at: latestPrivacy.updated_at,
      source: "privacy_consents",
    });
  }

  return merged.sort(
    (a, b) => new Date(b.accepted_at).getTime() - new Date(a.accepted_at).getTime()
  );
}

export async function buildMeusDadosPayload(
  pool: Pool,
  context: MeusDadosContext,
  options?: { forExport?: boolean; ipAtual?: string | null }
) {
  const userId = context.usersId;
  const limitHistorico = options?.forExport ? 200 : 50;
  const limitConsent = options?.forExport ? 100 : 20;
  const limitFrequencia = options?.forExport ? 500 : 60;
  const isAluno = !!context.cpf;
  const isStaff = !!context.staffKind;
  const isPatrocinador = context.actorType === "patrocinador";
  const profile = resolveMeusDadosProfile(context);
  const includeDonations = shouldIncludeDonationData(profile);

  const userQueryParams = userId != null ? [userId] : [];

  const [usuarioRows, doadoresRows, historicoRows, legalRows, privacyRows, solicitacoesRows] =
    await Promise.all([
      userId != null
        ? safeQuery(
            pool,
            `SELECT id, nome, email, telefone, cpf, plano, subscription_status, stripe_customer_id,
                    stripe_subscription_id, termos_uso_aceito_em, termos_uso_versao, created_at, updated_at
               FROM users WHERE id = $1`,
            userQueryParams
          )
        : Promise.resolve([]),
      includeDonations && userId != null
        ? safeQuery(
            pool,
            `SELECT id, plano, valor, periodicidade, status, ativo, data_doacao_inicial, ultima_doacao, created_at
               FROM doadores WHERE user_id = $1 ORDER BY created_at DESC`,
            userQueryParams
          )
        : Promise.resolve([]),
      includeDonations && userId != null
        ? safeQuery(
            pool,
            `SELECT hd.id, hd.valor, hd.plano, hd.status, hd.processed_at, hd.created_at
               FROM historico_doacao hd
               INNER JOIN doadores d ON d.id = hd.doador_id
              WHERE d.user_id = $1
              ORDER BY hd.created_at DESC
              LIMIT $2`,
            [userId, limitHistorico]
          )
        : Promise.resolve([]),
      userId != null
        ? safeQuery<LegalAcceptanceRow>(
            pool,
            `SELECT document_type, document_version, accepted_at::text AS accepted_at
               FROM user_legal_acceptances WHERE user_id = $1 ORDER BY accepted_at DESC`,
            userQueryParams
          )
        : Promise.resolve([]),
      userId != null
        ? safeQuery(
            pool,
            `SELECT consent_area, consent_version, privacy_policy_version, cookie_policy_version, terms_version,
                    analytics, functional, marketing, image_use, communications, source, updated_at::text AS updated_at
               FROM privacy_consents WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2`,
            [userId, limitConsent]
          )
        : Promise.resolve([]),
      userId != null
        ? safeQuery(
            pool,
            `SELECT id, request_type, status, description, response, requested_at::text AS requested_at,
                    completed_at::text AS completed_at
               FROM privacy_requests WHERE user_id = $1 ORDER BY requested_at DESC`,
            userQueryParams
          )
        : Promise.resolve([]),
    ]);

  let alunoBundle: {
    programa: string | null;
    fichaPec: Record<string, unknown> | null;
    fichaInclusao: Record<string, unknown> | null;
    cursos: Record<string, unknown>[];
    frequencia: Array<Record<string, unknown>>;
    responsaveis: Record<string, unknown>[];
  } | null = null;

  if (isAluno && context.cpf) {
    const cpf = context.cpf;
    const [ficha, cursos, frequencia, responsaveis] = await Promise.all([
      fetchAlunoFichaByCpf(pool, cpf),
      fetchAlunoCursosByCpf(pool, cpf),
      fetchAlunoFrequenciaByCpf(pool, cpf, limitFrequencia),
      fetchAlunoResponsaveisByCpf(pool, cpf),
    ]);
    alunoBundle = { ...ficha, cursos, frequencia, responsaveis };
  }

  let staffFicha: Record<string, unknown> | null = null;
  const usersRow = (usuarioRows[0] as Record<string, unknown> | undefined) ?? null;

  if (context.staffKind) {
    staffFicha = await fetchStaffFicha(
      pool,
      context.staffKind,
      context.staffId ?? null,
      userId,
      context.email ?? (usersRow?.email ? String(usersRow.email) : null)
    );
  }

  let patrocinadorFicha: Record<string, unknown> | null = null;
  if (isPatrocinador) {
    const patEmail =
      context.email ?? (usersRow?.email ? String(usersRow.email) : null);
    const patNome = usersRow?.nome ? String(usersRow.nome) : null;
    patrocinadorFicha = await fetchPatrocinadorForMeusDados(pool, patEmail, patNome, userId);
  }

  const fichaAtiva =
    alunoBundle?.fichaPec ||
    alunoBundle?.fichaInclusao ||
    null;

  let usuario: Record<string, unknown> | null = usersRow;
  if (isAluno && context.cpf) {
    usuario = buildUsuarioFromAlunoFicha(fichaAtiva, context.cpf, usersRow);
  } else if (isStaff && staffFicha) {
    usuario = buildUsuarioFromStaffFicha(staffFicha, usersRow);
  } else if (isPatrocinador && patrocinadorFicha) {
    usuario = buildUsuarioFromStaffFicha(patrocinadorFicha, usersRow);
  }

  let aceites = mergeLegalAcceptances(
    legalRows,
    usuario as { termos_uso_aceito_em?: string | null; termos_uso_versao?: string | null } | null,
    privacyRows as Array<{
      terms_version?: string | null;
      privacy_policy_version?: string | null;
      updated_at?: string;
    }>
  );

  if (alunoBundle?.fichaPec) {
    aceites = mergeAlunoTermosIntoAceites(aceites, {
      termos_uso_aceito_em: alunoBundle.fichaPec.termos_uso_aceito_em as string | null,
      termos_uso_versao: alunoBundle.fichaPec.termos_uso_versao as string | null,
    });
  }

  if (staffFicha) {
    const termosSource =
      context.staffKind === "coordenador"
        ? "coordenadores.termos_uso"
        : context.staffKind === "professor"
          ? "professores.termos_uso"
          : "monitores.termos_uso";
    aceites = mergeStaffTermosIntoAceites(
      aceites,
      {
        termos_uso_aceito_em: staffFicha.termos_uso_aceito_em as string | null,
        termos_uso_versao: staffFicha.termos_uso_versao as string | null,
      },
      termosSource
    );
  }

  const staffExtras = staffFicha
    ? {
        fichaStaff: staffFicha,
        perfilStaff: {
          tipo: context.staffKind,
          programa: staffFicha.programa ?? staffFicha.setor ?? null,
        },
      }
    : {};

  const patrocinadorExtras = patrocinadorFicha
    ? { patrocinio: patrocinadorFicha }
    : {};

  const tipoAtor = isAluno
    ? "aluno"
    : isPatrocinador
      ? "patrocinador"
      : isStaff
        ? context.staffKind || context.actorType || "staff"
        : context.actorType || "usuario";

  const usuarioExport = sanitizeUsuarioForProfile(usuario, profile);

  const base = {
    tipoAtor,
    perfilExportacao: profile,
    usuario: usuarioExport,
    doadores: includeDonations ? doadoresRows : [],
    doacoes: includeDonations ? historicoRows : [],
    aceites,
    consentimentos: privacyRows,
    solicitacoes: solicitacoesRows,
    ...(profile === "aluno" && alunoBundle
      ? {
          perfilAluno: {
            programa: alunoBundle.programa,
            cpf: context.cpf,
          },
          fichaPec: alunoBundle.fichaPec,
          fichaInclusao: alunoBundle.fichaInclusao,
          cursos: alunoBundle.cursos,
          frequencia: alunoBundle.frequencia,
          responsaveis: alunoBundle.responsaveis,
        }
      : {}),
    ...(profile === "staff" ? staffExtras : {}),
    ...(profile === "patrocinador" ? patrocinadorExtras : {}),
  };

  if (options?.forExport) {
    const common = {
      exportadoEm: new Date().toISOString(),
      tipoAtor: base.tipoAtor,
      perfilExportacao: profile,
      usuario: usuarioExport,
      documentosAceitos: base.aceites,
      historicoConsentimentos: base.consentimentos,
      solicitacoesPrivacidade: base.solicitacoes,
    };

    if (profile === "aluno" && alunoBundle) {
      return {
        ...common,
        perfilAluno: base.perfilAluno,
        fichaCadastroPec: alunoBundle.fichaPec,
        fichaCadastroInclusao: alunoBundle.fichaInclusao,
        matriculasCursos: alunoBundle.cursos,
        historicoFrequencia: alunoBundle.frequencia,
        responsaveisVinculados: alunoBundle.responsaveis,
      };
    }

    if (profile === "staff" && staffFicha) {
      return {
        ...common,
        fichaCadastroStaff: staffFicha,
        perfilStaff: staffExtras.perfilStaff,
      };
    }

    if (profile === "patrocinador") {
      return {
        ...common,
        ...(patrocinadorFicha ? { dadosPatrocinio: patrocinadorFicha } : {}),
      };
    }

    if (profile === "doador") {
      return {
        ...common,
        assinaturasDoador: doadoresRows,
        historicoDoacoes: historicoRows,
      };
    }

    return common;
  }

  return {
    ...base,
    dadosTecnicos: options?.ipAtual != null ? { ipAtual: options.ipAtual } : undefined,
  };
}
