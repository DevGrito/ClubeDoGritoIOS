-- Migration 0005: Marketing Users Password Authentication
-- Tabela para usuários de marketing com autenticação por senha

CREATE TABLE IF NOT EXISTS marketing_users (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  telefone TEXT,
  cargo TEXT, -- 'gestor', 'analista', 'assistente'
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para lookup rápido por email
CREATE INDEX IF NOT EXISTS idx_marketing_users_email ON marketing_users(email);

-- Índice para filtrar usuários ativos
CREATE INDEX IF NOT EXISTS idx_marketing_users_ativo ON marketing_users(ativo);

COMMENT ON TABLE marketing_users IS 'Usuários de marketing com autenticação por senha (bcrypt)';
COMMENT ON COLUMN marketing_users.password_hash IS 'Senha criptografada com bcrypt (salt rounds: 10)';
COMMENT ON COLUMN marketing_users.cargo IS 'Cargo: gestor, analista ou assistente';
