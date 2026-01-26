-- Migration: Adicionar autenticação com senha para coordenadores
-- Data: 2025-11-14
-- Descrição: Adiciona campo password_hash e define senhas iniciais

-- Adicionar coluna password_hash (permitir NULL temporariamente)
ALTER TABLE coordenadores 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Definir senha padrão temporária: "Coord2025!" (hash bcrypt)
-- Os coordenadores devem alterar após primeiro login
UPDATE coordenadores 
SET password_hash = '$2a$10$HJUBf9l8n/r8WkmJG9S10OatM1SM3kQhj3lKMpopJhxvtG.UOr09G'
WHERE password_hash IS NULL;

-- Tornar o campo obrigatório após definir valores
ALTER TABLE coordenadores 
ALTER COLUMN password_hash SET NOT NULL;

-- Adicionar comentário na tabela
COMMENT ON COLUMN coordenadores.password_hash IS 'Hash bcrypt da senha - Senha inicial: Coord2025!';
