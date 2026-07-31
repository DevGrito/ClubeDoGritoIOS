/**
 * Push de acolhimentos psico (aluno por CPF; staff por users.id / roles).
 * Regras são garantidas via ensureAcolhimentoPushRules (INSERT se não existir).
 */

import type { Pool } from "pg";

export type FirePushFn = (
  gatilho: string,
  vars?: Record<string, string>,
  excludeUserKey?: string,
  targetUserId?: number,
  targetUserKey?: string,
  ctx?: { vertente?: string; targetUserKeys?: string[] },
) => Promise<void> | void;

const PSICO_STAFF_ROLES = [
  "coordenador_psico",
  "monitor_psico",
  "tecnica_psico",
];

type RuleSeed = {
  nome: string;
  gatilho: string;
  destino_tela: string;
  destino_roles: string[];
  titulo: string;
  mensagem: string;
  url: string;
  cooldown_minutos: number;
};

const RULE_SEEDS: RuleSeed[] = [
  // ── Aluno
  {
    nome: "Acolhimento agendado — aluno",
    gatilho: "acolhimento_agendado",
    destino_tela: "aluno",
    destino_roles: ["aluno"],
    titulo: "Acolhimento agendado",
    mensagem: "Olá {{nome}}! Você tem acolhimento em {{data}} às {{horario}} · {{local}}.",
    url: "/aluno",
    cooldown_minutos: 0,
  },
  {
    nome: "Série de acolhimentos — aluno",
    gatilho: "acolhimento_serie_criada",
    destino_tela: "aluno",
    destino_roles: ["aluno"],
    titulo: "Acolhimentos agendados",
    mensagem: "Olá {{nome}}! Foram agendados {{total}} acolhimentos (a partir de {{data}} às {{horario}}).",
    url: "/aluno",
    cooldown_minutos: 0,
  },
  {
    nome: "Acolhimento cancelado — aluno",
    gatilho: "acolhimento_cancelado",
    destino_tela: "aluno",
    destino_roles: ["aluno"],
    titulo: "Acolhimento cancelado",
    mensagem: "Seu acolhimento de {{data}} às {{horario}} foi cancelado. Em dúvida, fale com a equipe psicossocial.",
    url: "/aluno",
    cooldown_minutos: 0,
  },
  {
    nome: "Falta no acolhimento — aluno",
    gatilho: "acolhimento_faltou",
    destino_tela: "aluno",
    destino_roles: ["aluno"],
    titulo: "Sobre o acolhimento",
    mensagem: "Registramos ausência no acolhimento de {{data}}. Se precisar de apoio, fale com a equipe psicossocial.",
    url: "/aluno",
    cooldown_minutos: 60,
  },
  {
    nome: "Lembrete D-1 acolhimento — aluno",
    gatilho: "acolhimento_lembrete_d1",
    destino_tela: "aluno",
    destino_roles: ["aluno"],
    titulo: "Acolhimento amanhã",
    mensagem: "Amanhã: acolhimento às {{horario}} · {{local}}.",
    url: "/aluno",
    cooldown_minutos: 720,
  },
  {
    nome: "Lembrete 2h acolhimento — aluno",
    gatilho: "acolhimento_lembrete_2h",
    destino_tela: "aluno",
    destino_roles: ["aluno"],
    titulo: "Acolhimento em breve",
    mensagem: "Hoje às {{horario}}: seu acolhimento · {{local}}.",
    url: "/aluno",
    cooldown_minutos: 180,
  },
  {
    nome: "Frequência baixa acolhimento — aluno",
    gatilho: "acolhimento_frequencia_baixa",
    destino_tela: "aluno",
    destino_roles: ["aluno"],
    titulo: "Frequência nos acolhimentos",
    mensagem: "Sua presença nos acolhimentos está em {{percentual}}%. Queremos te apoiar — fale com a equipe se precisar.",
    url: "/aluno",
    cooldown_minutos: 10080,
  },
  // ── Staff
  {
    nome: "Novo acolhimento — staff",
    gatilho: "acolhimento_novo_staff",
    destino_tela: "coordenador",
    destino_roles: ["coordenador_psico", "monitor_psico", "tecnica_psico"],
    titulo: "Novo acolhimento agendado",
    mensagem: "{{aluno}} · {{data}} às {{horario}} · {{local}} (por {{criado_por}}).",
    url: "/coordenador/psicossocial",
    cooldown_minutos: 0,
  },
  {
    nome: "Acolhimento cancelado — staff",
    gatilho: "acolhimento_cancelado_staff",
    destino_tela: "coordenador",
    destino_roles: ["coordenador_psico", "monitor_psico", "tecnica_psico"],
    titulo: "Acolhimento cancelado",
    mensagem: "{{aluno}} · {{data}} às {{horario}} foi cancelado.",
    url: "/coordenador/psicossocial",
    cooldown_minutos: 0,
  },
  {
    nome: "Resumo do dia — acolhimentos",
    gatilho: "acolhimento_resumo_dia",
    destino_tela: "monitor",
    destino_roles: ["coordenador_psico", "monitor_psico", "tecnica_psico"],
    titulo: "Acolhimentos hoje",
    mensagem: "Hoje: {{total}} acolhimento(s) · próximo às {{proximo}}.",
    url: "/monitor",
    cooldown_minutos: 720,
  },
  {
    nome: "Acolhimento em 15 min — staff",
    gatilho: "acolhimento_em_15min",
    destino_tela: "monitor",
    destino_roles: ["coordenador_psico", "monitor_psico", "tecnica_psico"],
    titulo: "Acolhimento em 15 minutos",
    mensagem: "{{aluno}} · às {{horario}} · {{local}}.",
    url: "/monitor",
    cooldown_minutos: 60,
  },
  {
    nome: "Muitas faltas — acolhimento",
    gatilho: "acolhimento_muitas_faltas",
    destino_tela: "coordenador",
    destino_roles: ["coordenador_psico", "monitor_psico", "tecnica_psico"],
    titulo: "Atenção: faltas em acolhimentos",
    mensagem: "{{aluno}} acumulou {{faltas}} falta(s) nos acolhimentos.",
    url: "/coordenador/psicossocial",
    cooldown_minutos: 10080,
  },
  {
    nome: "Frequência baixa — staff",
    gatilho: "acolhimento_frequencia_baixa_staff",
    destino_tela: "coordenador",
    destino_roles: ["coordenador_psico", "monitor_psico", "tecnica_psico"],
    titulo: "Frequência baixa nos acolhimentos",
    mensagem: "{{aluno}} com {{percentual}}% de presença nos acolhimentos.",
    url: "/coordenador/psicossocial",
    cooldown_minutos: 10080,
  },
  {
    nome: "Acolhimento sem status",
    gatilho: "acolhimento_sem_status",
    destino_tela: "monitor",
    destino_roles: ["coordenador_psico", "monitor_psico", "tecnica_psico"],
    titulo: "Acolhimento sem status",
    mensagem: "Ontem: {{aluno}} · {{horario}} ainda sem marcar (realizado/faltou).",
    url: "/monitor",
    cooldown_minutos: 720,
  },
  {
    nome: "Aluno sem próximo acolhimento",
    gatilho: "acolhimento_sem_proximo",
    destino_tela: "coordenador",
    destino_roles: ["coordenador_psico", "monitor_psico", "tecnica_psico"],
    titulo: "Sem próximo acolhimento",
    mensagem: "{{aluno}} teve acolhimentos recentes, mas está sem próximo agendado.",
    url: "/coordenador/psicossocial",
    cooldown_minutos: 10080,
  },
];

export async function ensureAcolhimentoPushRules(pool: Pool): Promise<void> {
  for (const r of RULE_SEEDS) {
    try {
      const exists = await pool.query(
        `SELECT id FROM push_rules WHERE gatilho = $1 LIMIT 1`,
        [r.gatilho],
      );
      if (exists.rows.length > 0) {
        // Mantém texto editável no marketing, mas alinha papéis (só psico)
        // e limpa URL fixa de staff (clique resolve por papel em pushClickUrls)
        const clearUrl = [
          "acolhimento_novo_staff",
          "acolhimento_cancelado_staff",
          "acolhimento_resumo_dia",
          "acolhimento_em_15min",
          "acolhimento_muitas_faltas",
          "acolhimento_frequencia_baixa_staff",
          "acolhimento_sem_status",
          "acolhimento_sem_proximo",
        ].includes(r.gatilho);
        await pool.query(
          `UPDATE push_rules
           SET destino_roles = $1,
               url = CASE WHEN $3 THEN NULL ELSE COALESCE(url, $4) END,
               updated_at = NOW()
           WHERE gatilho = $2`,
          [r.destino_roles, r.gatilho, clearUrl, r.url || null],
        );
        continue;
      }
      await pool.query(
        `INSERT INTO push_rules (
           nome, gatilho, destino_tela, destino_roles, titulo, mensagem, url,
           prioridade, tipo, cooldown_minutos, modulo_alvo, send_push, send_email, send_whatsapp, ativo
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,'normal','automatico',$8,'psico',true,false,false,true)`,
        [
          r.nome,
          r.gatilho,
          r.destino_tela,
          r.destino_roles,
          r.titulo,
          r.mensagem,
          r.url,
          r.cooldown_minutos,
        ],
      );
      console.log(`[PSICO-ACOLHIMENTO-PUSH] Regra criada: ${r.gatilho}`);
    } catch (e: any) {
      console.warn(`[PSICO-ACOLHIMENTO-PUSH] Seed ${r.gatilho}:`, e?.message || e);
    }
  }
}

function fmtDataBr(data: string): string {
  const s = String(data || "").split("T")[0];
  const [y, m, d] = s.split("-");
  if (!y || !m || !d) return s;
  return `${d}/${m}/${y}`;
}

function fmtHora(h?: string | null): string {
  if (!h) return "";
  return String(h).slice(0, 5);
}

function onlyDigits(v: string): string {
  return (v || "").replace(/\D/g, "");
}

async function jaDisparou(
  pool: Pool,
  gatilho: string,
  dedupeKey: string,
  janelaHoras: number,
): Promise<boolean> {
  const r = await pool.query(
    `SELECT 1 FROM push_logs
     WHERE gatilho = $1 AND payload->>'dedupe_key' = $2
       AND disparado_em > NOW() - ($3 || ' hours')::interval
     LIMIT 1`,
    [gatilho, dedupeKey, String(janelaHoras)],
  );
  return r.rows.length > 0;
}

async function calcFreqAluno(
  pool: Pool,
  cpf: string,
): Promise<{ compareceu: number; faltas: number; total: number; percentual: number }> {
  const r = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE status = 'realizado')::int AS compareceu,
       COUNT(*) FILTER (WHERE status = 'faltou')::int AS faltas
     FROM psico_acolhimentos
     WHERE aluno_cpf = $1 AND status IN ('realizado', 'faltou')`,
    [cpf],
  );
  const compareceu = Number(r.rows[0]?.compareceu || 0);
  const faltas = Number(r.rows[0]?.faltas || 0);
  const total = compareceu + faltas;
  const percentual = total > 0 ? Math.round((compareceu / total) * 100) : 100;
  return { compareceu, faltas, total, percentual };
}

async function notifyPsicoStaffBroadcast(
  fr: FirePushFn,
  gatilho: string,
  vars: Record<string, string>,
  excludeUserId?: number | null,
) {
  await fr(
    gatilho,
    vars,
    excludeUserId ? String(excludeUserId) : undefined,
    undefined,
    undefined,
    { vertente: "psico" },
  );
}

export async function notifyAcolhimentoCriado(opts: {
  pool: Pool;
  fr: FirePushFn;
  alunoCpf: string;
  alunoNome: string;
  data: string;
  horaInicio: string;
  local?: string | null;
  total: number;
  recorrente: boolean;
  criadoPorUserId?: number | null;
  criadoPorNome?: string | null;
}) {
  const cpf = onlyDigits(opts.alunoCpf);
  if (cpf.length !== 11) return;

  const varsBase = {
    nome: opts.alunoNome || "",
    aluno: opts.alunoNome || "",
    data: fmtDataBr(opts.data),
    horario: fmtHora(opts.horaInicio),
    local: opts.local || "",
    total: String(opts.total),
    criado_por: opts.criadoPorNome || "equipe",
    dedupe_key: `acolhimento_criado:${cpf}:${opts.data}:${fmtHora(opts.horaInicio)}:${opts.total}`,
  };

  if (opts.recorrente && opts.total > 1) {
    await opts.fr("acolhimento_serie_criada", varsBase, undefined, undefined, cpf);
  } else {
    await opts.fr("acolhimento_agendado", varsBase, undefined, undefined, cpf);
  }

  // Avisa staff (coordenadores/monitores), excluindo quem criou
  await notifyPsicoStaffBroadcast(
    opts.fr,
    "acolhimento_novo_staff",
    varsBase,
    opts.criadoPorUserId,
  );
}

export async function notifyAcolhimentoStatusChange(opts: {
  pool: Pool;
  fr: FirePushFn;
  row: {
    id: number;
    alunoCpf: string;
    alunoNome: string;
    data: string;
    horaInicio?: string | null;
    local?: string | null;
    profissionalUserId?: number | null;
    status: string;
  };
  actorUserId?: number | null;
}) {
  const cpf = onlyDigits(opts.row.alunoCpf);
  if (cpf.length !== 11) return;

  const dataBr = fmtDataBr(String(opts.row.data));
  const horario = fmtHora(opts.row.horaInicio);
  const vars = {
    nome: opts.row.alunoNome || "",
    aluno: opts.row.alunoNome || "",
    data: dataBr,
    horario,
    local: opts.row.local || "",
    dedupe_key: `acolhimento_status:${opts.row.id}:${opts.row.status}`,
  };

  if (opts.row.status === "cancelado") {
    await opts.fr("acolhimento_cancelado", vars, undefined, undefined, cpf);
    await notifyPsicoStaffBroadcast(
      opts.fr,
      "acolhimento_cancelado_staff",
      vars,
      opts.actorUserId,
    );
    return;
  }

  if (opts.row.status === "faltou") {
    await opts.fr("acolhimento_faltou", vars, undefined, undefined, cpf);

    const freq = await calcFreqAluno(opts.pool, cpf);
    if (freq.faltas >= 3) {
      const faltasVars = {
        ...vars,
        faltas: String(freq.faltas),
        dedupe_key: `acolhimento_muitas_faltas:${cpf}:${freq.faltas}`,
      };
      if (!(await jaDisparou(opts.pool, "acolhimento_muitas_faltas", faltasVars.dedupe_key, 168))) {
        if (opts.row.profissionalUserId) {
          await opts.fr("acolhimento_muitas_faltas", faltasVars, undefined, Number(opts.row.profissionalUserId));
        }
        await notifyPsicoStaffBroadcast(opts.fr, "acolhimento_muitas_faltas", faltasVars, opts.actorUserId);
      }
    }

    if (freq.total >= 2 && freq.percentual < 85) {
      await maybeNotifyFreqBaixa(opts.pool, opts.fr, cpf, opts.row.alunoNome, freq.percentual, opts.row.profissionalUserId);
    }
    return;
  }

  if (opts.row.status === "realizado") {
    const freq = await calcFreqAluno(opts.pool, cpf);
    if (freq.total >= 2 && freq.percentual < 85) {
      await maybeNotifyFreqBaixa(opts.pool, opts.fr, cpf, opts.row.alunoNome, freq.percentual, opts.row.profissionalUserId);
    }
  }
}

async function maybeNotifyFreqBaixa(
  pool: Pool,
  fr: FirePushFn,
  cpf: string,
  alunoNome: string,
  percentual: number,
  profissionalUserId?: number | null,
) {
  const dedupe = `acolhimento_freq_baixa:${cpf}:${percentual}`;
  if (await jaDisparou(pool, "acolhimento_frequencia_baixa", dedupe, 168)) return;

  const vars = {
    nome: alunoNome || "",
    aluno: alunoNome || "",
    percentual: String(percentual),
    dedupe_key: dedupe,
  };
  await fr("acolhimento_frequencia_baixa", vars, undefined, undefined, cpf);
  if (profissionalUserId) {
    await fr("acolhimento_frequencia_baixa_staff", vars, undefined, Number(profissionalUserId));
  }
  await notifyPsicoStaffBroadcast(fr, "acolhimento_frequencia_baixa_staff", vars);
}

function brtParts(now = new Date()) {
  const brt = new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const y = brt.getFullYear();
  const m = String(brt.getMonth() + 1).padStart(2, "0");
  const d = String(brt.getDate()).padStart(2, "0");
  const hh = brt.getHours();
  const mm = brt.getMinutes();
  return {
    date: `${y}-${m}-${d}`,
    totalMin: hh * 60 + mm,
    brt,
  };
}

function toTime(m: number) {
  const norm = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(norm / 60)).padStart(2, "0")}:${String(norm % 60).padStart(2, "0")}`;
}

function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(y, m - 1, d, 12, 0, 0);
  dt.setDate(dt.getDate() + days);
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, "0"),
    String(dt.getDate()).padStart(2, "0"),
  ].join("-");
}

/** Cron a cada 15 min: lembrete 2h aluno + 15 min staff */
export async function runAcolhimentoRemindersCron(pool: Pool, fr: FirePushFn) {
  const { date: hoje, totalMin } = brtParts();
  const proxMin = toTime(totalMin + 105);
  const proxMax = toTime(totalMin + 135);
  const em15Min = toTime(totalMin + 10);
  const em15Max = toTime(totalMin + 20);

  // Aluno ~2h antes
  const r2h = await pool.query(
    `SELECT id, aluno_cpf, aluno_nome, data, hora_inicio, local
     FROM psico_acolhimentos
     WHERE data = $1::date
       AND status IN ('agendado', 'reagendado')
       AND LEFT(hora_inicio, 5) >= $2
       AND LEFT(hora_inicio, 5) <= $3`,
    [hoje, proxMin, proxMax],
  );
  for (const row of r2h.rows) {
    const cpf = onlyDigits(row.aluno_cpf);
    if (cpf.length !== 11) continue;
    const horario = fmtHora(row.hora_inicio);
    const dedupeKey = `acolhimento_lembrete_2h:${row.id}:${hoje}:${horario}`;
    if (await jaDisparou(pool, "acolhimento_lembrete_2h", dedupeKey, 4)) continue;
    await fr(
      "acolhimento_lembrete_2h",
      {
        nome: row.aluno_nome || "",
        data: fmtDataBr(String(row.data)),
        horario,
        local: row.local || "",
        dedupe_key: dedupeKey,
      },
      undefined,
      undefined,
      cpf,
    );
  }

  // Staff ~15 min antes
  const r15 = await pool.query(
    `SELECT id, aluno_cpf, aluno_nome, data, hora_inicio, local, profissional_user_id
     FROM psico_acolhimentos
     WHERE data = $1::date
       AND status IN ('agendado', 'reagendado')
       AND LEFT(hora_inicio, 5) >= $2
       AND LEFT(hora_inicio, 5) <= $3`,
    [hoje, em15Min, em15Max],
  );
  for (const row of r15.rows) {
    const horario = fmtHora(row.hora_inicio);
    const dedupeKey = `acolhimento_em_15min:${row.id}:${hoje}:${horario}`;
    if (await jaDisparou(pool, "acolhimento_em_15min", dedupeKey, 4)) continue;
    const vars = {
      aluno: row.aluno_nome || "",
      data: fmtDataBr(String(row.data)),
      horario,
      local: row.local || "",
      dedupe_key: dedupeKey,
    };
    if (row.profissional_user_id) {
      await fr("acolhimento_em_15min", vars, undefined, Number(row.profissional_user_id));
    } else {
      await notifyPsicoStaffBroadcast(fr, "acolhimento_em_15min", vars);
    }
  }
}

/** Cron diário manhã: D-1 aluno + resumo do dia staff */
export async function runAcolhimentoDailyMorningCron(pool: Pool, fr: FirePushFn) {
  const { date: hoje } = brtParts();
  const amanha = addDays(hoje, 1);

  // D-1 alunos
  const d1 = await pool.query(
    `SELECT id, aluno_cpf, aluno_nome, data, hora_inicio, local
     FROM psico_acolhimentos
     WHERE data = $1::date AND status IN ('agendado', 'reagendado')`,
    [amanha],
  );
  for (const row of d1.rows) {
    const cpf = onlyDigits(row.aluno_cpf);
    if (cpf.length !== 11) continue;
    const horario = fmtHora(row.hora_inicio);
    const dedupeKey = `acolhimento_lembrete_d1:${row.id}:${amanha}`;
    if (await jaDisparou(pool, "acolhimento_lembrete_d1", dedupeKey, 30)) continue;
    await fr(
      "acolhimento_lembrete_d1",
      {
        nome: row.aluno_nome || "",
        data: fmtDataBr(String(row.data)),
        horario,
        local: row.local || "",
        dedupe_key: dedupeKey,
      },
      undefined,
      undefined,
      cpf,
    );
  }

  // Resumo do dia por profissional
  const hojeRows = await pool.query(
    `SELECT profissional_user_id, COUNT(*)::int AS total,
            MIN(LEFT(hora_inicio, 5)) AS proximo
     FROM psico_acolhimentos
     WHERE data = $1::date AND status IN ('agendado', 'reagendado')
     GROUP BY profissional_user_id`,
    [hoje],
  );
  for (const row of hojeRows.rows) {
    const total = Number(row.total || 0);
    if (total <= 0) continue;
    const uid = row.profissional_user_id ? Number(row.profissional_user_id) : null;
    const dedupeKey = `acolhimento_resumo_dia:${uid || "all"}:${hoje}`;
    if (await jaDisparou(pool, "acolhimento_resumo_dia", dedupeKey, 20)) continue;
    const vars = {
      total: String(total),
      proximo: row.proximo || "",
      data: fmtDataBr(hoje),
      dedupe_key: dedupeKey,
    };
    if (uid) {
      await fr("acolhimento_resumo_dia", vars, undefined, uid);
    } else {
      await notifyPsicoStaffBroadcast(fr, "acolhimento_resumo_dia", vars);
    }
  }
}

/** Cron diário: sem status de ontem + aluno sem próximo */
export async function runAcolhimentoDailyFollowupCron(pool: Pool, fr: FirePushFn) {
  const { date: hoje } = brtParts();
  const ontem = addDays(hoje, -1);

  const pendentes = await pool.query(
    `SELECT id, aluno_cpf, aluno_nome, data, hora_inicio, local, profissional_user_id
     FROM psico_acolhimentos
     WHERE data = $1::date AND status IN ('agendado', 'reagendado')`,
    [ontem],
  );
  for (const row of pendentes.rows) {
    const horario = fmtHora(row.hora_inicio);
    const dedupeKey = `acolhimento_sem_status:${row.id}:${ontem}`;
    if (await jaDisparou(pool, "acolhimento_sem_status", dedupeKey, 30)) continue;
    const vars = {
      aluno: row.aluno_nome || "",
      data: fmtDataBr(String(row.data)),
      horario,
      local: row.local || "",
      dedupe_key: dedupeKey,
    };
    if (row.profissional_user_id) {
      await fr("acolhimento_sem_status", vars, undefined, Number(row.profissional_user_id));
    } else {
      await notifyPsicoStaffBroadcast(fr, "acolhimento_sem_status", vars);
    }
  }

  // Sem próximo: teve concluído nos últimos 30 dias e não tem futuro agendado
  const semProx = await pool.query(
    `WITH recentes AS (
       SELECT DISTINCT ON (aluno_cpf) aluno_cpf, aluno_nome, profissional_user_id
       FROM psico_acolhimentos
       WHERE status IN ('realizado', 'faltou')
         AND data >= ($1::date - INTERVAL '30 days')
       ORDER BY aluno_cpf, data DESC
     ),
     futuros AS (
       SELECT DISTINCT aluno_cpf
       FROM psico_acolhimentos
       WHERE status IN ('agendado', 'reagendado')
         AND data >= $1::date
     )
     SELECT r.aluno_cpf, r.aluno_nome, r.profissional_user_id
     FROM recentes r
     LEFT JOIN futuros f ON f.aluno_cpf = r.aluno_cpf
     WHERE f.aluno_cpf IS NULL`,
    [hoje],
  );
  for (const row of semProx.rows) {
    const cpf = onlyDigits(row.aluno_cpf);
    if (cpf.length !== 11) continue;
    const dedupeKey = `acolhimento_sem_proximo:${cpf}:${hoje.slice(0, 7)}`;
    if (await jaDisparou(pool, "acolhimento_sem_proximo", dedupeKey, 720)) continue;
    const vars = {
      aluno: row.aluno_nome || "",
      dedupe_key: dedupeKey,
    };
    if (row.profissional_user_id) {
      await fr("acolhimento_sem_proximo", vars, undefined, Number(row.profissional_user_id));
    }
    await notifyPsicoStaffBroadcast(fr, "acolhimento_sem_proximo", vars);
  }
}

export { PSICO_STAFF_ROLES };
