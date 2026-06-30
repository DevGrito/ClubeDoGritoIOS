import type { Pool } from "pg";

export const MANUAL_SENHA_VALIDADE_MESES = 2;

export type VertenteManual = "pec" | "inclusao";

export type SenhaManualStatus = {
  vertente: VertenteManual;
  definida: boolean;
  expirada: boolean;
  expiraEm: string | null;
  definidaEm: string | null;
  diasRestantes: number | null;
  requerTroca: boolean;
};

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function validarFormatoSenhaManual(senha: string): string | null {
  const s = String(senha || "");
  if (s.length < 8) return "A senha deve ter no mínimo 8 caracteres.";
  if (s.length > 64) return "A senha deve ter no máximo 64 caracteres.";
  if (!/[a-zA-Z]/.test(s) || !/[0-9]/.test(s)) {
    return "A senha deve ser alfanumérica (letras e números).";
  }
  return null;
}

export async function ensurePresencaManualSenhasTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS presenca_manual_senhas (
      id SERIAL PRIMARY KEY,
      vertente TEXT NOT NULL UNIQUE CHECK (vertente IN ('pec', 'inclusao')),
      senha_hash TEXT NOT NULL,
      definida_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expira_em TIMESTAMPTZ NOT NULL,
      alterada_por INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await pool.query(`ALTER TABLE chamada_manual_logs ADD COLUMN IF NOT EXISTS vertente TEXT`);
  await pool.query(`ALTER TABLE chamada_manual_logs ADD COLUMN IF NOT EXISTS origem TEXT`);
  await pool.query(`ALTER TABLE chamada_manual_logs ADD COLUMN IF NOT EXISTS observacao TEXT`);
  await pool.query(`ALTER TABLE chamada_manual_logs ADD COLUMN IF NOT EXISTS tablet_user_id INTEGER`);
  await pool.query(`ALTER TABLE chamada_manual_logs ADD COLUMN IF NOT EXISTS actor_nome TEXT`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chamada_tablet_logs (
      id SERIAL PRIMARY KEY,
      vertente TEXT NOT NULL CHECK (vertente IN ('pec', 'inclusao')),
      turma_id INTEGER,
      turma_nome TEXT,
      data_chamada DATE NOT NULL,
      modo TEXT NOT NULL CHECK (modo IN ('facial', 'manual')),
      justificativa TEXT,
      observacao TEXT,
      tablet_user_id INTEGER,
      tablet_username TEXT,
      total_presentes INTEGER,
      total_alunos INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

export async function getSenhaManualStatus(
  pool: Pool,
  vertente: VertenteManual
): Promise<SenhaManualStatus> {
  const { rows } = await pool.query(
    `SELECT definida_em, expira_em FROM presenca_manual_senhas WHERE vertente = $1 LIMIT 1`,
    [vertente]
  );
  if (!rows.length) {
    return {
      vertente,
      definida: false,
      expirada: true,
      expiraEm: null,
      definidaEm: null,
      diasRestantes: null,
      requerTroca: true,
    };
  }
  const row = rows[0] as { definida_em: Date; expira_em: Date };
  const expiraEm = new Date(row.expira_em);
  const agora = new Date();
  const expirada = agora >= expiraEm;
  const diasRestantes = Math.ceil((expiraEm.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24));
  return {
    vertente,
    definida: true,
    expirada,
    expiraEm: expiraEm.toISOString(),
    definidaEm: new Date(row.definida_em).toISOString(),
    diasRestantes: expirada ? 0 : diasRestantes,
    requerTroca: expirada,
  };
}

export async function validarSenhaManualAtiva(
  pool: Pool,
  vertente: VertenteManual,
  senha: string
): Promise<{ valido: boolean; error?: string }> {
  const status = await getSenhaManualStatus(pool, vertente);
  if (!status.definida) {
    return { valido: false, error: "Senha de chamada manual não configurada pelo coordenador." };
  }
  if (status.expirada) {
    return { valido: false, error: "Senha de chamada manual expirada. O coordenador deve definir uma nova." };
  }

  const { rows } = await pool.query(
    `SELECT senha_hash FROM presenca_manual_senhas WHERE vertente = $1 LIMIT 1`,
    [vertente]
  );
  if (!rows.length) {
    return { valido: false, error: "Senha não encontrada." };
  }

  const bcryptMod = await import("bcryptjs");
  const bcrypt = (bcryptMod as any).default || bcryptMod;
  const ok = await bcrypt.compare(senha, (rows[0] as { senha_hash: string }).senha_hash);
  if (!ok) return { valido: false, error: "Senha incorreta." };
  return { valido: true };
}

export async function definirOuTrocarSenhaManual(
  pool: Pool,
  vertente: VertenteManual,
  alteradaPor: number,
  opts: { senhaAtual?: string; senhaNova: string }
): Promise<{ success: boolean; error?: string; expiraEm?: string }> {
  const fmtErr = validarFormatoSenhaManual(opts.senhaNova);
  if (fmtErr) return { success: false, error: fmtErr };

  const status = await getSenhaManualStatus(pool, vertente);
  const bcryptMod = await import("bcryptjs");
  const bcrypt = (bcryptMod as any).default || bcryptMod;

  if (status.definida) {
    if (!opts.senhaAtual) {
      return { success: false, error: "Informe a senha atual." };
    }
    const { rows } = await pool.query(
      `SELECT senha_hash FROM presenca_manual_senhas WHERE vertente = $1 LIMIT 1`,
      [vertente]
    );
    if (!rows.length) {
      return { success: false, error: "Senha não encontrada." };
    }
    const okAtual = await bcrypt.compare(opts.senhaAtual, (rows[0] as { senha_hash: string }).senha_hash);
    if (!okAtual) {
      return { success: false, error: "Senha atual incorreta." };
    }
  }

  const hash = await bcrypt.hash(opts.senhaNova, 10);
  const agora = new Date();
  const expiraEm = addMonths(agora, MANUAL_SENHA_VALIDADE_MESES);

  await pool.query(
    `INSERT INTO presenca_manual_senhas (vertente, senha_hash, definida_em, expira_em, alterada_por, updated_at)
     VALUES ($1, $2, $3, $4, $5, $3)
     ON CONFLICT (vertente) DO UPDATE SET
       senha_hash = EXCLUDED.senha_hash,
       definida_em = EXCLUDED.definida_em,
       expira_em = EXCLUDED.expira_em,
       alterada_por = EXCLUDED.alterada_por,
       updated_at = EXCLUDED.updated_at`,
    [vertente, hash, agora, expiraEm, alteradaPor]
  );

  return { success: true, expiraEm: expiraEm.toISOString() };
}
