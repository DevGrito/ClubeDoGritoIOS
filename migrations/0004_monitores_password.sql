-- Migration: Criar tabela monitores com autenticação
-- Data: 2025-11-14
-- Descrição: Cria tabela independente para monitores com senha

-- Criar tabela monitores
CREATE TABLE IF NOT EXISTS monitores (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  telefone TEXT,
  programa TEXT NOT NULL, -- 'pec', 'inclusao_produtiva', 'psicossocial'
  redirect_path TEXT NOT NULL DEFAULT '/monitor',
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índice no email para performance
CREATE INDEX IF NOT EXISTS idx_monitores_email ON monitores(email);

-- Adicionar comentários
COMMENT ON TABLE monitores IS 'Tabela de monitores com autenticação por senha';
COMMENT ON COLUMN monitores.password_hash IS 'Hash bcrypt da senha do monitor';
COMMENT ON COLUMN monitores.programa IS 'Programa do monitor: pec, inclusao_produtiva, ou psicossocial';
