-- Migration: Create monitor tables for RBAC monitor features
-- Date: 2025-11-14
-- Database: Digital Ocean PostgreSQL
-- Description: Creates 4 monitor tables required for monitor RBAC functionality

-- Monitor Participantes: Links monitors to students they track
CREATE TABLE IF NOT EXISTS monitor_participantes (
  id SERIAL PRIMARY KEY,
  monitor_user_id INTEGER NOT NULL REFERENCES users(id),
  participante_id INTEGER NOT NULL REFERENCES participantes_inclusao(id),
  acompanhamento_status TEXT DEFAULT 'ativo',
  observacoes_privadas TEXT,
  ultima_interacao TIMESTAMP,
  acompanhamento_tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Atividades Monitor: Activities planned/created by monitors
CREATE TABLE IF NOT EXISTS atividades_monitor (
  id SERIAL PRIMARY KEY,
  monitor_user_id INTEGER NOT NULL REFERENCES users(id),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL,
  grupo TEXT,
  data TIMESTAMP NOT NULL,
  horario_inicio TEXT NOT NULL,
  horario_fim TEXT NOT NULL,
  local TEXT,
  participantes_esperados INTEGER DEFAULT 0,
  participantes_presentes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'planejada',
  observacoes TEXT,
  materiais_necessarios TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Monitor Grupos: Groups managed by monitors
CREATE TABLE IF NOT EXISTS monitor_grupos (
  id SERIAL PRIMARY KEY,
  monitor_user_id INTEGER NOT NULL REFERENCES users(id),
  turma_id INTEGER REFERENCES turma(id),
  nome TEXT NOT NULL,
  nivel TEXT,
  alunos INTEGER DEFAULT 0,
  frequencia NUMERIC(5,2) DEFAULT 0,
  atividade TEXT,
  status TEXT DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Registros Atividades: Activity reports created by monitors
CREATE TABLE IF NOT EXISTS registros_atividades (
  id SERIAL PRIMARY KEY,
  monitor_user_id INTEGER NOT NULL REFERENCES users(id),
  data_atividade DATE NOT NULL,
  grupo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  duracao_minutos INTEGER,
  participantes INTEGER,
  resultados_observacoes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_monitor_participantes_monitor ON monitor_participantes(monitor_user_id);
CREATE INDEX IF NOT EXISTS idx_monitor_participantes_participante ON monitor_participantes(participante_id);
CREATE INDEX IF NOT EXISTS idx_atividades_monitor_user ON atividades_monitor(monitor_user_id);
CREATE INDEX IF NOT EXISTS idx_atividades_monitor_data ON atividades_monitor(data);
CREATE INDEX IF NOT EXISTS idx_monitor_grupos_user ON monitor_grupos(monitor_user_id);
CREATE INDEX IF NOT EXISTS idx_registros_atividades_monitor ON registros_atividades(monitor_user_id);
CREATE INDEX IF NOT EXISTS idx_registros_atividades_data ON registros_atividades(data_atividade);
