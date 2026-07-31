-- Usuários de chamada via tablet (porta das salas)
CREATE TABLE IF NOT EXISTS tablet_chamada_usuarios (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  vertente TEXT NOT NULL CHECK (vertente IN ('pec', 'inclusao')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP DEFAULT NOW()
);
