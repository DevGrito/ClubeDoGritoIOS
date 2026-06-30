import type { Pool } from "pg";

/** Garante tabela user_consents (legado espelhado a partir de privacy_consents). */
export async function ensureUserConsentsTable(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_consents (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      consent_type VARCHAR(80) NOT NULL,
      granted BOOLEAN NOT NULL DEFAULT FALSE,
      version VARCHAR(20) NOT NULL DEFAULT '1.0',
      granted_at TIMESTAMPTZ,
      revoked_at TIMESTAMPTZ,
      ip_address VARCHAR(100),
      user_agent TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, consent_type)
    )
  `);
  const alters = [
    "CREATE INDEX IF NOT EXISTS idx_user_consents_user_id ON user_consents(user_id)",
    "ALTER TABLE user_consents ADD COLUMN IF NOT EXISTS ip_address VARCHAR(100)",
    "ALTER TABLE user_consents ADD COLUMN IF NOT EXISTS user_agent TEXT",
    "ALTER TABLE user_consents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()",
  ];
  for (const q of alters) {
    await pool.query(q).catch(() => {});
  }
}
