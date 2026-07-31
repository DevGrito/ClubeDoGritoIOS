/**
 * Unificação de duplicatas PEC ↔ Inclusão no mestre atendidos_grito.
 *
 * Match:
 *  1) CPF idêntico
 *  2) Nome completo normalizado + confirmação por data de nascimento
 *     (quando CPF diferente)
 *
 * Prioridade de dados / CPF canônico: cadastro mais recente
 * (GREATEST(created_at, updated_at)). Se um CPF for provisório e o outro real,
 * o CPF real vira identidade canônica, mas os campos vêm do mais recente.
 *
 * Uso (SOMENTE banco local):
 *   npx dotenv -e .env.test-local -- tsx scripts/merge-duplicatas-atendidos.ts
 *   npx dotenv -e .env.test-local -- tsx scripts/merge-duplicatas-atendidos.ts --execute
 */
import type { Pool, PoolClient } from "pg";
import { isCpfProvisorio, normalizeCpfDigits } from "@shared/cpf";

export type FonteCadastro = "pec" | "inclusao" | "mestre";

export interface PessoaFonte {
  fonte: FonteCadastro;
  cpf: string;
  nomeCompleto: string;
  nomeNorm: string;
  dataNascimento: string | null;
  telefoneNorm: string | null;
  emailNorm: string | null;
  createdAt: Date;
  updatedAt: Date;
  recency: Date;
  legadoId: string | null;
}

export interface MergePair {
  reason: "cpf" | "nome_nascimento" | "nome_fraco";
  confidence: "alta" | "media" | "baixa";
  winnerCpf: string;
  loserCpf: string;
  nome: string;
  dataNascimento: string | null;
  fontes: FonteCadastro[];
  winnerRecency: string;
  loserRecency: string;
  details: string;
}

export interface DedupPreview {
  dryRun: boolean;
  database: string;
  host: string;
  totalPessoas: number;
  porCpf: number;
  candidatosNome: number;
  merges: MergePair[];
  amostra: MergePair[];
  executed: number;
  skipped: number;
  errors: Array<{ pair: string; error: string }>;
}

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizePersonName(input: unknown): string {
  return stripAccents(String(input || ""))
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizePhone(input: unknown): string | null {
  const d = String(input || "").replace(/\D/g, "");
  if (d.length < 10) return null;
  return d.slice(-11);
}

function toDateOnly(val: unknown): string | null {
  if (!val) return null;
  const s = String(val).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function toDate(val: unknown): Date {
  if (!val) return new Date(0);
  const d = new Date(String(val));
  return Number.isNaN(d.getTime()) ? new Date(0) : d;
}

function pickRecency(createdAt: Date, updatedAt: Date): Date {
  return createdAt.getTime() >= updatedAt.getTime() ? createdAt : updatedAt;
}

async function loadPessoas(pool: Pool): Promise<PessoaFonte[]> {
  const out: PessoaFonte[] = [];

  const pec = await pool.query(`
    SELECT
      REGEXP_REPLACE(COALESCE(cpf, ''), '[^0-9]', '', 'g') AS cpf,
      nome_completo,
      data_nascimento,
      telefone,
      email,
      created_at,
      updated_at
    FROM aluno
    WHERE length(REGEXP_REPLACE(COALESCE(cpf, ''), '[^0-9]', '', 'g')) = 11
  `);
  for (const r of pec.rows) {
    const cpf = normalizeCpfDigits(r.cpf);
    if (cpf.length !== 11) continue;
    const createdAt = toDate(r.created_at);
    const updatedAt = toDate(r.updated_at);
    out.push({
      fonte: "pec",
      cpf,
      nomeCompleto: String(r.nome_completo || "").trim() || "Sem nome",
      nomeNorm: normalizePersonName(r.nome_completo),
      dataNascimento: toDateOnly(r.data_nascimento),
      telefoneNorm: normalizePhone(r.telefone),
      emailNorm: r.email ? String(r.email).trim().toLowerCase() : null,
      createdAt,
      updatedAt,
      recency: pickRecency(createdAt, updatedAt),
      legadoId: cpf,
    });
  }

  const inclusao = await pool.query(`
    SELECT
      id,
      REGEXP_REPLACE(COALESCE(cpf, ''), '[^0-9]', '', 'g') AS cpf,
      nome,
      data_nascimento,
      telefone,
      email,
      created_at,
      updated_at
    FROM participantes_inclusao
    WHERE length(REGEXP_REPLACE(COALESCE(cpf, ''), '[^0-9]', '', 'g')) = 11
  `);
  for (const r of inclusao.rows) {
    const cpf = normalizeCpfDigits(r.cpf);
    if (cpf.length !== 11) continue;
    const createdAt = toDate(r.created_at);
    const updatedAt = toDate(r.updated_at);
    out.push({
      fonte: "inclusao",
      cpf,
      nomeCompleto: String(r.nome || "").trim() || "Sem nome",
      nomeNorm: normalizePersonName(r.nome),
      dataNascimento: toDateOnly(r.data_nascimento),
      telefoneNorm: normalizePhone(r.telefone),
      emailNorm: r.email ? String(r.email).trim().toLowerCase() : null,
      createdAt,
      updatedAt,
      recency: pickRecency(createdAt, updatedAt),
      legadoId: String(r.id),
    });
  }

  const mestre = await pool.query(`
    SELECT
      cpf,
      nome_completo,
      data_nascimento,
      telefone,
      email,
      created_at,
      updated_at
    FROM atendidos_grito
    WHERE length(REGEXP_REPLACE(COALESCE(cpf, ''), '[^0-9]', '', 'g')) = 11
  `);
  for (const r of mestre.rows) {
    const cpf = normalizeCpfDigits(r.cpf);
    if (cpf.length !== 11) continue;
    const createdAt = toDate(r.created_at);
    const updatedAt = toDate(r.updated_at);
    out.push({
      fonte: "mestre",
      cpf,
      nomeCompleto: String(r.nome_completo || "").trim() || "Sem nome",
      nomeNorm: normalizePersonName(r.nome_completo),
      dataNascimento: toDateOnly(r.data_nascimento),
      telefoneNorm: normalizePhone(r.telefone),
      emailNorm: r.email ? String(r.email).trim().toLowerCase() : null,
      createdAt,
      updatedAt,
      recency: pickRecency(createdAt, updatedAt),
      legadoId: null,
    });
  }

  return out.filter((p) => p.nomeNorm.length >= 5);
}

function chooseWinnerLoser(a: PessoaFonte, b: PessoaFonte): { winner: PessoaFonte; loser: PessoaFonte } {
  const aProv = isCpfProvisorio(a.cpf);
  const bProv = isCpfProvisorio(b.cpf);

  // Identidade: preferir CPF real; campos/recency decidem o “último cadastro”
  if (aProv !== bProv) {
    const real = aProv ? b : a;
    const prov = aProv ? a : b;
    return { winner: real, loser: prov };
  }

  if (a.recency.getTime() !== b.recency.getTime()) {
    return a.recency.getTime() > b.recency.getTime()
      ? { winner: a, loser: b }
      : { winner: b, loser: a };
  }

  // Empate: preferir não-provisório já tratado; senão ordem estável por CPF
  return a.cpf < b.cpf ? { winner: a, loser: b } : { winner: b, loser: a };
}

function buildPairs(pessoas: PessoaFonte[]): MergePair[] {
  const byCpf = new Map<string, PessoaFonte[]>();
  for (const p of pessoas) {
    const list = byCpf.get(p.cpf) || [];
    list.push(p);
    byCpf.set(p.cpf, list);
  }

  const pairs: MergePair[] = [];
  const seen = new Set<string>(); // "cpfMenor|cpfMaior"

  // 1) Mesmo CPF em fontes diferentes → só precisa garantir mestre (merge de identidade já é o CPF)
  // Não gera pair de CPF diferente.

  // 2) Nome completo igual, CPF diferente
  const byNome = new Map<string, PessoaFonte[]>();
  // Uma entrada representativa por CPF (a mais recente)
  const bestByCpf = new Map<string, PessoaFonte>();
  for (const [cpf, list] of byCpf) {
    const best = [...list].sort((a, b) => b.recency.getTime() - a.recency.getTime())[0];
    bestByCpf.set(cpf, best);
  }

  for (const p of bestByCpf.values()) {
    const list = byNome.get(p.nomeNorm) || [];
    list.push(p);
    byNome.set(p.nomeNorm, list);
  }

  for (const [, list] of byNome) {
    if (list.length < 2) continue;
    // Comparar todos os pares com CPF distinto
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const b = list[j];
        if (a.cpf === b.cpf) continue;

        const key = [a.cpf, b.cpf].sort().join("|");
        if (seen.has(key)) continue;

        const nascA = a.dataNascimento;
        const nascB = b.dataNascimento;

        // Ambos com nascimento e divergem → não merge
        if (nascA && nascB && nascA !== nascB) continue;

        let reason: MergePair["reason"] = "nome_fraco";
        let confidence: MergePair["confidence"] = "baixa";
        const details: string[] = [`nome="${a.nomeCompleto}"`];

        if (nascA && nascB && nascA === nascB) {
          reason = "nome_nascimento";
          confidence = "alta";
          details.push(`nascimento=${nascA}`);
        } else if (nascA || nascB) {
          reason = "nome_fraco";
          confidence = "media";
          details.push(`nascimento_parcial=${nascA || nascB}`);
        } else {
          // Sem nascimento: só aceita se telefone bater (e-mail sozinho gera falso positivo institucional)
          const phoneMatch =
            a.telefoneNorm && b.telefoneNorm && a.telefoneNorm === b.telefoneNorm;
          if (!phoneMatch) continue;
          reason = "nome_fraco";
          confidence = "media";
          details.push(`telefone=${a.telefoneNorm}`);
        }

        // Se já há evidência forte de fontes cruzadas PEC+Inclusão, eleva confiança
        const fontes = [...new Set([...byCpf.get(a.cpf)!, ...byCpf.get(b.cpf)!].map((x) => x.fonte))];
        if (
          confidence !== "alta" &&
          fontes.includes("pec") &&
          fontes.includes("inclusao") &&
          (nascA || nascB)
        ) {
          confidence = "media";
        }

        const { winner, loser } = chooseWinnerLoser(a, b);
        seen.add(key);
        pairs.push({
          reason,
          confidence,
          winnerCpf: winner.cpf,
          loserCpf: loser.cpf,
          nome: winner.nomeCompleto || loser.nomeCompleto,
          dataNascimento: winner.dataNascimento || loser.dataNascimento,
          fontes: fontes.filter((f) => f !== "mestre") as FonteCadastro[],
          winnerRecency: winner.recency.toISOString(),
          loserRecency: loser.recency.toISOString(),
          details: details.join("; "),
        });
      }
    }
  }

  // Ordenar: alta confiança primeiro
  const rank = { alta: 0, media: 1, baixa: 2 };
  return pairs.sort((a, b) => rank[a.confidence] - rank[b.confidence] || a.nome.localeCompare(b.nome, "pt-BR"));
}

async function ensureWinnerMaster(
  client: PoolClient,
  winner: PessoaFonte,
  loser: PessoaFonte
): Promise<void> {
  // Garante linha do winner; copia campos do mais recente se winner estiver incompleto
  const recent = winner.recency >= loser.recency ? winner : loser;
  await client.query(
    `INSERT INTO atendidos_grito (
      cpf, cpf_provisorio, nome_completo, data_nascimento, telefone, email, status, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, 'ativo', NOW())
    ON CONFLICT (cpf) DO UPDATE SET
      nome_completo = COALESCE(NULLIF(EXCLUDED.nome_completo, ''), atendidos_grito.nome_completo),
      data_nascimento = COALESCE(EXCLUDED.data_nascimento, atendidos_grito.data_nascimento),
      telefone = COALESCE(NULLIF(EXCLUDED.telefone, ''), atendidos_grito.telefone),
      email = COALESCE(NULLIF(EXCLUDED.email, ''), atendidos_grito.email),
      updated_at = NOW()`,
    [
      winner.cpf,
      isCpfProvisorio(winner.cpf),
      recent.nomeCompleto,
      recent.dataNascimento,
      recent.telefoneNorm,
      recent.emailNorm,
    ]
  );
}

async function repointCpfEverywhere(
  client: PoolClient,
  fromCpf: string,
  toCpf: string
): Promise<void> {
  // Programa: move o que não conflita; apaga o resto do loser
  await client.query(
    `UPDATE atendidos_grito_programa SET cpf = $2
     WHERE cpf = $1
       AND NOT EXISTS (
         SELECT 1 FROM atendidos_grito_programa p
         WHERE p.cpf = $2 AND p.programa = atendidos_grito_programa.programa
       )`,
    [fromCpf, toCpf]
  );
  await client.query(`DELETE FROM atendidos_grito_programa WHERE cpf = $1`, [fromCpf]);

  await client.query(`UPDATE atendidos_grito_observacoes SET cpf = $2 WHERE cpf = $1`, [
    fromCpf,
    toCpf,
  ]);

  // FKs unificação / histórico
  const updates: Array<[string, string]> = [
    [`UPDATE monitor_participantes SET atendido_cpf = $2 WHERE atendido_cpf = $1`, "monitor_participantes"],
    [`UPDATE documentos_participante SET atendido_cpf = $2 WHERE atendido_cpf = $1`, "documentos_participante"],
    [`UPDATE participantes_turmas SET atendido_cpf = $2 WHERE atendido_cpf = $1`, "participantes_turmas"],
    [`UPDATE inclusao_evasoes SET atendido_cpf = $2 WHERE atendido_cpf = $1`, "inclusao_evasoes"],
    [`UPDATE presencas_inclusao SET atendido_cpf = $2 WHERE atendido_cpf = $1`, "presencas_inclusao"],
    [
      `UPDATE instance_enrollments SET student_cpf = $2
       WHERE REGEXP_REPLACE(COALESCE(student_cpf,''), '[^0-9]', '', 'g') = $1
         AND NOT EXISTS (
           SELECT 1 FROM instance_enrollments ie2
           WHERE ie2.activity_instance_id = instance_enrollments.activity_instance_id
             AND REGEXP_REPLACE(COALESCE(ie2.student_cpf,''), '[^0-9]', '', 'g') = $2
         )`,
      "instance_enrollments",
    ],
    [
      `UPDATE pec_evasoes SET student_cpf = $2
       WHERE REGEXP_REPLACE(COALESCE(student_cpf,''), '[^0-9]', '', 'g') = $1`,
      "pec_evasoes",
    ],
  ];

  for (const [sql] of updates) {
    try {
      await client.query(sql, [fromCpf, toCpf]);
    } catch {
      // Coluna pode não existir em algum ambiente antigo — segue
    }
  }

  // Marca merge no mestre vencedor
  await client.query(
    `UPDATE atendidos_grito
     SET dados_complementares = COALESCE(dados_complementares, '{}'::jsonb)
       || jsonb_build_object(
            'cpf_merged_from',
            COALESCE(dados_complementares->'cpf_merged_from', '[]'::jsonb) || to_jsonb($2::text),
            'merge_at', to_jsonb(NOW()::text)
          ),
         updated_at = NOW()
     WHERE cpf = $1`,
    [toCpf, fromCpf]
  );

  await client.query(`DELETE FROM atendidos_grito WHERE cpf = $1`, [fromCpf]);
}

async function executeMerge(
  client: PoolClient,
  pair: MergePair,
  index: Map<string, PessoaFonte>
): Promise<void> {
  const winner = index.get(pair.winnerCpf);
  const loser = index.get(pair.loserCpf);
  if (!winner || !loser) throw new Error("Pessoa não encontrada no índice");

  await ensureWinnerMaster(client, winner, loser);

  // Se loser ainda não está no mestre, cria temporário e migra
  const loserExists = await client.query(
    `SELECT 1 FROM atendidos_grito WHERE cpf = $1 LIMIT 1`,
    [loser.cpf]
  );
  if (loserExists.rows.length === 0) {
    await client.query(
      `INSERT INTO atendidos_grito (cpf, cpf_provisorio, nome_completo, data_nascimento, status, updated_at)
       VALUES ($1, $2, $3, $4, 'ativo', NOW())
       ON CONFLICT (cpf) DO NOTHING`,
      [loser.cpf, isCpfProvisorio(loser.cpf), loser.nomeCompleto, loser.dataNascimento]
    );
  }

  // Garante vínculos de programa a partir das fontes
  for (const fonte of pair.fontes) {
    if (fonte !== "pec" && fonte !== "inclusao") continue;
    await client.query(
      `INSERT INTO atendidos_grito_programa (cpf, programa, status, updated_at)
       VALUES ($1, $2, 'ativo', NOW())
       ON CONFLICT (cpf, programa) DO UPDATE SET updated_at = NOW()`,
      [winner.cpf, fonte]
    );
  }

  await repointCpfEverywhere(client, loser.cpf, winner.cpf);
}

export function assertLocalDatabase(host: string, dbName: string): void {
  const h = String(host || "").toLowerCase();
  const db = String(dbName || "").toLowerCase();
  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  if (!localHosts.has(h)) {
    throw new Error(`Abortado: host não é local (${host}). Só rode em localhost.`);
  }
  if (!db.includes("local") && db !== "clube-do-grito-local") {
    throw new Error(
      `Abortado: database "${dbName}" não parece local de teste. Use clube-do-grito-local.`
    );
  }
}

export async function runDedupMerge(
  pool: Pool,
  options: { dryRun?: boolean; minConfidence?: "alta" | "media" | "baixa" } = {}
): Promise<DedupPreview> {
  const dryRun = options.dryRun !== false;
  const minConfidence = options.minConfidence || "media";

  const info = await pool.query<{ db: string; usr: string }>(
    `SELECT current_database() AS db, current_user AS usr`
  );
  const host = process.env.DB_HOST || "localhost";
  assertLocalDatabase(host, info.rows[0]?.db || "");

  const pessoas = await loadPessoas(pool);
  const allPairs = buildPairs(pessoas);

  const confRank = { alta: 3, media: 2, baixa: 1 };
  const minRank = confRank[minConfidence];
  const merges = allPairs.filter((p) => confRank[p.confidence] >= minRank);

  // Índice: melhor pessoa por CPF
  const index = new Map<string, PessoaFonte>();
  for (const p of pessoas) {
    const cur = index.get(p.cpf);
    if (!cur || p.recency > cur.recency) index.set(p.cpf, p);
  }

  let executed = 0;
  let skipped = 0;
  const errors: DedupPreview["errors"] = [];

  if (!dryRun) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      // Evita cadeia A→B e B→C no mesmo batch: processa em ordem e pula se loser já sumiu
      const alreadyMerged = new Set<string>();
      for (const pair of merges) {
        if (alreadyMerged.has(pair.loserCpf) || alreadyMerged.has(pair.winnerCpf) && alreadyMerged.has(pair.loserCpf)) {
          skipped++;
          continue;
        }
        // Se winner foi mergeado como loser antes, redireciona
        let winnerCpf = pair.winnerCpf;
        let loserCpf = pair.loserCpf;
        while (alreadyMerged.has(winnerCpf)) {
          // não deve acontecer se só perdemos losers; break
          break;
        }
        if (alreadyMerged.has(loserCpf)) {
          skipped++;
          continue;
        }
        try {
          await executeMerge(client, { ...pair, winnerCpf, loserCpf }, index);
          alreadyMerged.add(loserCpf);
          executed++;
        } catch (e: any) {
          errors.push({
            pair: `${loserCpf}→${winnerCpf}`,
            error: e?.message || String(e),
          });
        }
      }
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  return {
    dryRun,
    database: info.rows[0]?.db || "",
    host,
    totalPessoas: pessoas.length,
    porCpf: new Set(pessoas.map((p) => p.cpf)).size,
    candidatosNome: allPairs.length,
    merges,
    amostra: merges.slice(0, 30),
    executed,
    skipped,
    errors,
  };
}
