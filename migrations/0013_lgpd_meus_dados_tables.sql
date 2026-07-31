-- LGPD: tabelas para portal do titular (meus dados)

CREATE TABLE IF NOT EXISTS user_legal_acceptances (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  document_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
  ip_address VARCHAR(100),
  user_agent TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_legal_acceptances_user_id ON user_legal_acceptances(user_id);

CREATE TABLE IF NOT EXISTS privacy_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  request_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  description TEXT,
  response TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_privacy_requests_user_id ON privacy_requests(user_id);
