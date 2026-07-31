-- Senha alfanumérica de chamada manual por vertente (coordenador define, validade 2 meses)
CREATE TABLE IF NOT EXISTS presenca_manual_senhas (
  id SERIAL PRIMARY KEY,
  vertente TEXT NOT NULL UNIQUE CHECK (vertente IN ('pec', 'inclusao')),
  senha_hash TEXT NOT NULL,
  definida_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expira_em TIMESTAMPTZ NOT NULL,
  alterada_por INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enriquecer log de chamada manual (auditoria)
ALTER TABLE chamada_manual_logs ADD COLUMN IF NOT EXISTS vertente TEXT;
ALTER TABLE chamada_manual_logs ADD COLUMN IF NOT EXISTS origem TEXT;
ALTER TABLE chamada_manual_logs ADD COLUMN IF NOT EXISTS observacao TEXT;
ALTER TABLE chamada_manual_logs ADD COLUMN IF NOT EXISTS tablet_user_id INTEGER;
ALTER TABLE chamada_manual_logs ADD COLUMN IF NOT EXISTS actor_nome TEXT;

-- Log de chamadas concluídas via tablet (facial ou manual)
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
);

CREATE INDEX IF NOT EXISTS idx_chamada_tablet_logs_data ON chamada_tablet_logs (data_chamada DESC);
CREATE INDEX IF NOT EXISTS idx_chamada_manual_logs_data ON chamada_manual_logs (data DESC);
